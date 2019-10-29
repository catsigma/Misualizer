import { get } from "https"

// @flow

function clone(x : Object) {
  try {
    return JSON.parse(JSON.stringify(x))
  } catch(e) {
    debugger
  }
}

const getId = (() => {
  const ids = 'abcdefghijklmnopqrstuvwxyz'.toUpperCase().split('')
  const mem = {}
  return (t : string, node? : Object) => {
    if (node && node.annots)
      return node.annots[0] + ':' + t

    if (!(t in mem)) {
      mem[t] = ids.slice()
    }

    return mem[t].shift() + ':' + t
  }
})()

export class Contract {
  stack : Array<Object>

  parameter : Object
  parameter_t : Array<Object>
  storage_t : Array<Object>
  code : Array<Object>

  storage : Object
  balance : string

  op_tree : Object

  constructor(contract_info : Object) {
    if (contract_info instanceof Array) {
      this.parameter_t = contract_info[0].args
      this.storage_t = contract_info[1].args
      this.code = contract_info[2].args
    } else {
      this.storage = contract_info.script.storage
      this.balance = contract_info.balance
  
      this.parameter_t = contract_info.script.code[0].args
      this.storage_t = contract_info.script.code[1].args
      this.code = contract_info.script.code[2].args
    }

    this.stack = [{
      kind: 'pair',
      children: [
        this.getMockFromType(this.parameter_t[0]),
        this.getMockFromType(this.storage_t[0])
      ]
    }]

    this.op_tree = []
  }


  getMockFromType(input_type : Object) {
    const walk = (input : Object) => {
      let inside_value
      if (input.args instanceof Array) {
        if (input.prim === 'lambda') {
          inside_value = {
            parameter: walk(input.args[0]),
            return: walk(input.args[1])
          }

        } else if (input.prim === 'option') {
          inside_value = walk(input.args[0])

        } else if (input.prim === 'map') {
          inside_value = {
            key: walk(input.args[0]),
            value: walk(input.args[1])
          }

        } else if (input.prim === 'big_map') {
          inside_value = {
            key: walk(input.args[0]),
            value: walk(input.args[1])
          }

        } else if (input.prim === 'set') {
          inside_value = walk(input.args[0])

        } else if (input.prim === 'contract') {
          inside_value = {
            parameter: walk(input.args[0]),
          }
        } else {
          inside_value = input.args.map(arg => walk(arg))
        }
      }

      const prim_mapping = {
        pair() {
          return {
            kind: 'pair',
            children: inside_value
          }
        },
        or() {
          return {
            kind: 'or',
            children: inside_value
          }
        },
        list() {
          const t = inside_value[0].prim || inside_value[0].kind
          return {
            kind: 'list',
            t,
            value: getId(`list<${t}>`, input),
            uncertain: true,
            children: []
          }
        },
        option() {
          return {
            kind: 'option',
            item: inside_value
          }
        },
        map() {
          const key_t = inside_value.key ? inside_value.key.kind : ''
          const value_t = inside_value.value ? inside_value.value.kind : ''
          return {
            kind: 'map',
            t: inside_value,
            value: getId(`map<${key_t}, ${value_t}>`, input),
            children: []
          }
        },
        big_map() {
          const key_t = inside_value.key ? inside_value.key.kind : ''
          const value_t = inside_value.value ? inside_value.value.kind : ''
          return {
            kind: 'big_map',
            t: inside_value,
            value: getId(`big_map<${key_t}, ${value_t}>`, input),
            children: []
          }
        },
        set() {
          return {
            kind: 'set',
            t: inside_value,
            value: getId(`set<${inside_value.kind || ''}>`, input)
          }
        },
        lambda() {
          return Object.assign({}, {
            kind: 'lambda',
            value: getId('lambda', input)
          }, inside_value)
        },
        contract() {
          return Object.assign({}, {
            kind: 'contract',
            value: getId('contract', input)
          }, inside_value)
        },
        unit() {
          return {
            kind: 'unit',
            value: 'Unit'
          }
        },
        operation() {
          return {
            kind: 'operation',
            value: getId('operation', input)
          }
        },
        address() {
          return {
            kind: 'address',
            value: getId('address', input)
          }
        },
        nat() {
          return {
            kind: 'nat',
            value: getId('nat', input)
          }
        },
        timestamp() {
          return {
            kind: 'timestamp',
            value: getId('timestamp', input)
          }
        },
        int() {
          return {
            kind: 'int',
            value: getId('int', input)
          }
        },
        bool() {
          return {
            kind: 'bool',
            value: getId('bool', input)
          }
        },
        string() {
          return {
            kind: 'string',
            value: getId('string', input)
          }
        },
        key_hash() {
          return {
            kind: 'key_hash',
            value: getId('key_hash', input)
          }
        },
        bytes() {
          return {
            kind: 'bytes',
            value: getId('bytes', input)
          }
        },
        mutez() {
          return {
            kind: 'mutez',
            value: getId('mutez', input)
          }
        },
        key() {
          return {
            kind: 'key',
            value: getId('key', input)
          }
        },
        signature() {
          return {
            kind: 'signature',
            value: getId('signature', input)
          }
        }
      }
      
      if (input.prim in prim_mapping) {
        const output = prim_mapping[input.prim]()
        return Object.assign(output, {annots: input.annots})
      } else {
        throw `unhandled type '${input.prim}'`
      }

    }

    return walk(input_type)
  }

  parseCode(no_branchs : boolean = false) {
    const node_mapping = {}
    let node_id = 1

    let last : Object
    const walk = (code_instrs : Array<Object>, stack : Array<Object>, dip_top : number, graph_cursor : Object) : boolean => {
      last = {
        cursor: graph_cursor,
        stack
      }

      for (let i = 0; i < code_instrs.length; i++) {
        const instr = code_instrs[i]

        if (instr instanceof Array) {
          const remain_codes = code_instrs.slice(i + 1)
          return walk(instr.concat(remain_codes), stack, dip_top, graph_cursor)
        }

        if (instr.prim === 'IF') {
          node_mapping[node_id] = {
            name: 'from_if',
            value: clone(stack)
          }
          const g = {
            node_id: node_id++,
            branchs: {
              true: [],
              false: []
            }
          }
          graph_cursor.push(g)
          stack.splice(dip_top, 1)
          // node_mapping[node_id] = {
          //   name: 'start_true',
          //   value: clone(stack)
          // }
          // g.branchs.true.push({
          //   node_id: node_id++
          // })
          // node_mapping[node_id] = {
          //   name: 'start_false',
          //   value: clone(stack)
          // }
          // g.branchs.false.push({
          //   node_id: node_id++
          // })

          const remain_codes = code_instrs.slice(i + 1)
          const [stack_true, stack_false] = clone([stack, stack])

          const has_branchs1 = walk(instr.args[0].concat(remain_codes), stack_true, dip_top, g.branchs.true)
          const has_branchs2 = no_branchs || walk(instr.args[1].concat(remain_codes), stack_false, dip_top, g.branchs.false)

          if (!has_branchs1) {
            node_mapping[node_id] = {
              name: 'end_true',
              value: clone(stack_true)
            }
            g.branchs.true.push({
              node_id: node_id++
            })
          }

          if (!has_branchs2) {
            node_mapping[node_id] = {
              name: 'end_false',
              value: clone(stack_false)
            }
            g.branchs.false.push({
              node_id: node_id++,
            })
          }

          return true

        } else if (instr.prim === 'IF_LEFT') {
          node_mapping[node_id] = {
            name: 'from_if_left',
            value: clone(stack)
          }
          const g = {
            node_id: node_id++,
            branchs: {
              left: [],
              right: []
            }
          }
          graph_cursor.push(g)

          const [left_stack, right_stack] = clone([stack, stack])
          left_stack[dip_top] = left_stack[dip_top].children[0]
          right_stack[dip_top] = right_stack[dip_top].children[1]
          node_mapping[node_id] = {
            name: 'start_left',
            value: clone(left_stack)
          }
          g.branchs.left.push({
            node_id: node_id++,
          })
          node_mapping[node_id] = {
            name: 'start_right',
            value: clone(right_stack)
          }
          g.branchs.right.push({
            node_id: node_id++,
          })

          const remain_codes = code_instrs.slice(i + 1)
          const has_branchs1 = walk(instr.args[0].concat(remain_codes), left_stack, dip_top, g.branchs.left)
          const has_branchs2 = no_branchs || walk(instr.args[1].concat(remain_codes), right_stack, dip_top, g.branchs.right)
        
          if (!has_branchs1) {
            node_mapping[node_id] = {
              name: 'end_left',
              value: clone(left_stack)
            }
            g.branchs.left.push({
              node_id: node_id++
            })
          }

          if (!has_branchs2) {
            node_mapping[node_id] = {
              name: 'end_right',
              value: clone(right_stack)
            }
            g.branchs.right.push({
              node_id: node_id++
            })
          }

          return true

        } else if (instr.prim === 'IF_NONE') {
          node_mapping[node_id] = {
            name: 'from_if_none',
            value: clone(stack)
          }
          const g = {
            node_id: node_id++,
            branchs: {
              none: [],
              some: []
            }
          }
          graph_cursor.push(g)
          
          const [none_stack, some_stack] = clone([stack, stack])
          none_stack.splice(dip_top, 1)
          some_stack[dip_top] = Object.assign(
            some_stack[dip_top].item,
            {clac: some_stack[dip_top].calc}
          )
          
          node_mapping[node_id] = {
            name: 'start_none',
            value: clone(none_stack)
          }
          g.branchs.none.push({
            node_id: node_id++,
          })
          node_mapping[node_id] = {
            name: 'start_some',
            value: clone(some_stack)
          }
          g.branchs.some.push({
            node_id: node_id++,
          })

          const remain_codes = code_instrs.slice(i + 1)
          const has_branchs1 = no_branchs || walk(instr.args[0].concat(remain_codes), none_stack, dip_top, g.branchs.none)
          const has_branchs2 = walk(instr.args[1].concat(remain_codes), some_stack, dip_top, g.branchs.some)

          if (!has_branchs1) {
            node_mapping[node_id] = {
              name: 'end_none',
              value: clone(none_stack)
            }
            g.branchs.none.push({
              node_id: node_id++
            })
          }

          if (!has_branchs2) {
            node_mapping[node_id] = {
              name: 'end_some',
              value: clone(some_stack)
            }
            g.branchs.some.push({
              node_id: node_id++
            })
          }

          return true

        // } else if (instr.prim === 'IF_CONS' && instr.uncertain) {
        //   node_mapping[node_id] = {
        //     name: 'from_if_cons',
        //     value: clone(stack)
        //   }
        //   const g = {
        //     node_id: node_id++,
        //     branchs: {
        //       rest: [],
        //       empty: []
        //     }
        //   }
        //   graph_cursor.push(g)
          
        //   const [rest_stack, empty_stack] = clone([stack, stack])
        //   const [lst] = rest_stack.splice(dip_top, 1)
        //   const hd = lst
        //   rest_stack.splice(dip_top, 0, [{
        //     kind: lst.t,
        //     value: getId(lst.t)
        //   }, lst])

        //   empty_stack.splice(dip_top, 1)
          
        //   node_mapping[node_id] = {
        //     name: 'start_rest',
        //     value: clone(rest_stack)
        //   }
        //   g.branchs.rest.push({
        //     node_id: node_id++,
        //   })
        //   node_mapping[node_id] = {
        //     name: 'start_some',
        //     value: clone(empty_stack)
        //   }
        //   g.branchs.empty.push({
        //     node_id: node_id++,
        //   })

        //   const remain_codes = code_instrs.slice(i + 1)
        //   const has_branchs1 = walk(instr.args[0].concat(remain_codes), rest_stack, dip_top, g.branchs.rest)
        //   const has_branchs2 = no_branchs || walk(instr.args[1].concat(remain_codes), empty_stack, dip_top, g.branchs.empty)

        //   if (!has_branchs1) {
        //     node_mapping[node_id] = {
        //       name: 'end_none',
        //       value: clone(rest_stack)
        //     }
        //     g.branchs.rest.push({
        //       node_id: node_id++
        //     })
        //   }

        //   if (!has_branchs2) {
        //     node_mapping[node_id] = {
        //       name: 'end_empty',
        //       value: clone(empty_stack)
        //     }
        //     g.branchs.empty.push({
        //       node_id: node_id++
        //     })
        //   }

        //   return true

        } else if (instr.prim === 'IF_CONS') {
          // TODO branchs
          const [lst] = stack.splice(dip_top, 1)
          const remain_codes = code_instrs.slice(i + 1)

          if (lst.children && lst.children.length) {
            const hd = lst.children.shift()
            stack.splice(dip_top, 0, [hd, lst])
            return walk(instr.args[0].concat(remain_codes), stack, dip_top, graph_cursor)
          } else {
            return walk(instr.args[1].concat(remain_codes), stack, dip_top, graph_cursor)
          }

        } else if (instr.prim === 'DUP') {
          stack.splice(dip_top, 0, clone(stack[dip_top]))

        } else if (instr.prim === 'RENAME') {
          stack[dip_top].annots = instr.annots 

        } else if (instr.prim === 'ITER') {
          stack.splice(dip_top, 1)
          // // TODO
          // stack[dip_top] = {
          //   kind: stack[dip_top].t,
          //   value: getId(stack[dip_top].t)
          // }
          // code_instrs[i--] = instr.args[0]

        } else if (instr.prim === 'INT') {
          stack[dip_top] = {
            kind: 'int',
            value: getId('int'),
            calc: {
              op: 'int',
              stack: [stack[dip_top]]
            }
          }

        } else if (instr.prim === 'PACK') {
          stack[dip_top] = {
            kind: 'bytes',
            value: getId('bytes'),
            calc: {
              op: 'pack',
              stack: [stack[dip_top]]
            }
          }

        } else if (instr.prim === 'CONS') {
          const [elem] = stack.splice(dip_top, 1)
          stack[dip_top].children.unshift(elem)

        } else if (instr.prim === 'DROP') {
          stack.splice(dip_top, 1)
          
        } else if (instr.prim === 'SWAP') {
          const temp = stack[dip_top]
          stack[dip_top] = stack[dip_top + 1]
          stack[dip_top + 1] = temp

        } else if (instr.prim === 'SELF') {
          stack.splice(dip_top, 0, {
            kind: 'contract',
            parameter: this.getMockFromType(this.parameter_t[0]),
            value: 'SELF'
          })

        } else if (instr.prim === 'ADDRESS') {
          stack[dip_top] = {
            kind: 'address',
            value: stack[dip_top]
          }

        } else if (instr.prim === 'LAMBDA') {
          stack.splice(dip_top, 0, {
            kind: 'lambda',
            value: getId('lambda'),
            parameter: instr.args[0],
            return: instr.args[1],
            code: instr.args[2]
          })

        } else if (instr.prim === 'EXEC') {
          const [p, lambda_fn] = stack.splice(dip_top, 2)

          if (lambda_fn.code) {
            stack.splice(dip_top, 0, p)
            code_instrs[i--] = lambda_fn.code

            // const breaked = walk(lambda_fn.code, stack, dip_top, graph_cursor)
            // if (breaked)
            //   break

          } else {
            stack.splice(dip_top, 0, {
              kind: 'exec',
              return: lambda_fn.return.kind,
              lambda: lambda_fn.value,
              parameter: p,
              value: getId(lambda_fn.return.kind)
            })
          }
          
        } else if (instr.prim === 'IMPLICIT_ACCOUNT') {
          stack[dip_top] = {
            kind: 'contract',
            parameter: {
              kind: 'unit',
              value: 'unit'
            },
            value: stack[dip_top]
          }

        } else if (instr.prim === 'SENDER') {
          stack.splice(dip_top, 0, {
            kind: 'address',
            value: 'SENDER'
          })

        } else if (instr.prim === 'SOURCE') {
          stack.splice(dip_top, 0, {
            kind: 'address',
            value: 'SOURCE'
          })

        } else if (instr.prim === 'PAIR') {
          stack.splice(dip_top, 0, {
            kind: 'pair',
            children: stack.splice(dip_top, 2)
          })

        } else if (instr.prim === 'NIL') {
          const lst_t = instr.args[0].prim
          stack.splice(dip_top, 0, {
            kind: 'list',
            t: lst_t,
            value: getId(`list<${lst_t}>`),
            children: []
          })

        } else if (instr.prim === 'UNIT') {
          stack.splice(dip_top, 0, {
            kind: 'unit',
            value: 'Unit'
          })

        } else if (instr.prim === 'FAILWITH') {
          stack.unshift({
            kind: 'fail',
            value: stack.splice(dip_top, 1)[0]
          })
          
          return false

        } else if (instr.prim === 'CAR') {
          stack[dip_top] = stack[dip_top].children[0]

        } else if (instr.prim === 'CDR') {
          stack[dip_top] = stack[dip_top].children[1]

        } else if (instr.prim === 'UNDIP') {
          dip_top -= 1
          
        } else if (instr.prim === 'DIP') {
          code_instrs[i--] = instr.args.concat({prim: 'UNDIP'})
          dip_top += 1

        } else if (instr.prim === 'PUSH') {
          stack.splice(dip_top, 0, {
            kind: instr.args[0].prim,
            value: Object.values(instr.args[1])[0]
          })
          
        } else if (instr.prim === 'SET_DELEGATE') {
          stack[dip_top] = {
            kind: 'operation',
            value: getId('operation'),
            calc: {
              op: 'set_delegate',
              stack: [stack[dip_top]]
            }
          }

        } else if (instr.prim === 'TRANSFER_TOKENS') {
          stack.splice(dip_top, 0, {
            kind: 'operation',
            value: getId('operation'),
            calc: {
              op: 'transfer_tokens',
              stack: stack.splice(dip_top, 3)
            }
          })
          
        } else if (instr.prim === 'CHECK_SIGNATURE') {
          stack.splice(dip_top, 0, {
            kind: 'bool',
            value: getId('bool'),
            calc: {
              op: 'check_signature',
              stack: stack.splice(dip_top, 3)
            }
          })

        } else if (instr.prim === 'BALANCE') {
          stack.splice(dip_top, 0, {
            kind: 'mutez',
            value: 'BALANCE'
          })

        } else if (instr.prim === 'AMOUNT') {
          stack.splice(dip_top, 0, {
            kind: 'mutez',
            value: 'TX_AMOUNT'
          })

        } else if (instr.prim === 'SUB') {
          stack.splice(dip_top, 0, {
            kind: 'int',
            value: getId('int'),
            calc: {
              op: 'sub',
              stack: stack.splice(dip_top, 2)
            }
          })

        } else if (instr.prim === 'ADD') {
          const [a, b] = stack.splice(dip_top, 2)
          const kind_set = new Set([a, b].map(x => x.kind))
          const kind = 
            kind_set.has('timestamp') ? 'timestamp' : 
            kind_set.has('int') ? 'int' :
            kind_set.has('mutez') ? 'mutez' : 'nat'

          stack.splice(dip_top, 0, {
            kind,
            value: getId(kind),
            calc: {
              op: 'add',
              stack: [a, b]
            }
          })

        } else if (instr.prim === 'UPDATE') {
          const elems = stack.splice(dip_top, 3)
          if (elems[2].kind === 'set') {
            const [elem, is_adding, set] = elems
            stack.splice(dip_top, 0, {
              kind: 'set',
              t: set.t,
              value: getId('set'),
              calc: {
                op: 'update_set',
                stack: elems
              }
            })
          } else {
            const [key, val, map] = elems
            stack.splice(dip_top, 0, {
              kind: map.kind,
              t: map.t,
              value: getId(map.kind),
              calc: {
                op: 'update_map',
                stack: elems
              }
            })
          }

        } else if (instr.prim === 'SOME') {
          stack[dip_top] = {
            kind: 'some',
            t: stack[dip_top].kind,
            value: stack[dip_top]
          }

        } else if (instr.prim === 'GET') {
          const [key, map] = stack.splice(dip_top, 2)
          stack.splice(dip_top, 0, {
            kind: 'option',
            item: map.t.value,
            calc: {
              op: 'get',
              stack: [key, map]
            }
          })

        } else if (instr.prim === 'COMPARE') {
          stack.splice(dip_top, 0, {
            kind: 'compare',
            value: stack.splice(dip_top, 2)
          })

        } else if (instr.prim === 'MEM') {
          const [elem, set] = stack.splice(dip_top, 2)
          stack.splice(dip_top, 0, {
            kind: 'bool',
            symbol: 'IN',
            value: {
              kind: 'compare',
              value: [elem, set]
            }
          })

        } else if (instr.prim === 'NOT') {
          stack.splice(dip_top, 0, {
            kind: 'bool',
            symbol: '~',
            value: getId('bool'),
            calc: {
              op: 'not',
              stack: stack.splice(dip_top, 1)
            }
          })

        } else if (instr.prim === 'OR') {
          stack.splice(dip_top, 0, {
            kind: 'bool',
            symbol: '|',
            value: getId('bool'),
            calc: {
              op: 'or',
              stack: stack.splice(dip_top, 2)
            }
          })

        } else if (instr.prim === 'NEQ') {
          stack.splice(dip_top, 0, {
            kind: 'bool',
            symbol: '!=',
            value: stack.splice(dip_top, 1)[0]
          })

        } else if (instr.prim === 'EQ') {
          stack.splice(dip_top, 0, {
            kind: 'bool',
            symbol: '==',
            value: stack.splice(dip_top, 1)[0]
          })

        } else if (instr.prim === 'GT') {
          stack.splice(dip_top, 0, {
            kind: 'bool',
            symbol: '>',
            value: stack.splice(dip_top, 1)[0]
          })

        } else if (instr.prim === 'LE') {
          stack.splice(dip_top, 0, {
            kind: 'bool',
            symbol: '<=',
            value: stack.splice(dip_top, 1)[0]
          })

        } else if (instr.prim === 'LT') {
          stack.splice(dip_top, 0, {
            kind: 'bool',
            symbol: '<',
            value: stack.splice(dip_top, 1)[0]
          })
          
        } else if (instr.prim === 'GE') {
          stack.splice(dip_top, 0, {
            kind: 'bool',
            symbol: '>=',
            value: stack.splice(dip_top, 1)[0]
          })

        } else if (instr.prim === 'NOW') {
          stack.splice(dip_top, 0, {
            kind: 'timestamp',
            value: 'NOW'
          })

        } else {
          throw `unhandled instruction: ${instr.prim}`
        }
        
      }

      return false
    }

    node_mapping[node_id] = {
      name: 'start',
      value: clone(this.stack)
    }
    const graph = [{
      node_id: node_id++,
    }]
    walk(this.code[0], clone(this.stack), 0, graph)


    node_mapping[node_id] = {
      name: 'final',
      value: clone(last.stack)
    }
    const g = {
      node_id: node_id++
    }
    last.cursor.push(g)

    
    return {
      graph_tree: graph,
      node_mapping
    }
  }

  
}


