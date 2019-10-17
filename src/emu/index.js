// @flow

function clone(x : Object) {
  return JSON.parse(JSON.stringify(x))
}

const getId = (() => {
  const ids = 'abcdefghijklmnopqrstuvwxyz'.toUpperCase().split('')
  const mem = {}
  return (t : string) => {
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
    this.storage = contract_info.script.storage
    this.balance = contract_info.balance

    this.parameter_t = contract_info.script.code[0].args
    this.storage_t = contract_info.script.code[1].args
    this.code = contract_info.script.code[2].args

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
          console.log(12345)
          return {
            kind: 'list',
            t: inside_value[0].prim,
            value: getId('list'),
            children: inside_value
          }
        },
        lambda() {
          return Object.assign({}, {
            kind: 'lambda',
            value: getId('lambda')
          }, inside_value)
        },
        contract() {
          return Object.assign({}, {
            kind: 'contract',
            value: getId('contract')
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
            value: getId('operation')
          }
        },
        address() {
          return {
            kind: 'address',
            value: getId('address')
          }
        },
        nat() {
          return {
            kind: 'nat',
            value: getId('nat')
          }
        },
        bool() {
          return {
            kind: 'bool',
            value: getId('bool')
          }
        },
        key_hash() {
          return {
            kind: 'key_hash',
            value: getId('key_hash')
          }
        }
      }

      const output = prim_mapping[input.prim]()
      if (input.prim in prim_mapping) {
        return Object.assign(output, {annots: input.annots})
      } else {
        throw input
      }

    }

    return walk(input_type)
  }

  parseCode() {
    const node_mapping = {}
    let node_id = 1

    const branchs = []
    const walk = (code_instrs : Array<Object>, stack : Array<Object>, dip_top : number, graph_cursor : Object) : boolean => {
      let breaked = false

      if (stack[0].kind === 'fail')
        return false

      for (let i = 0; i < code_instrs.length; i++) {
        const instr = code_instrs[i]

        if (branchs.length) {
          const remain_codes = code_instrs.slice(i)
          const [[stack1, cursor1], [stack2, cursor2]] : Object = branchs.splice(0, branchs.length)

          const breaked1 = walk(remain_codes, stack1, dip_top, cursor1)
          const breaked2 = walk(remain_codes, stack2, dip_top, cursor2)
          
          if (!breaked1) {
            node_mapping[node_id] = {
              name: 'end',
              value: clone(stack1)
            }
            cursor1.push({
              node_id: node_id++
            })
          }

          if (breaked2) {
            node_mapping[node_id] = {
              name: 'end',
              value: clone(stack2)
            }
            cursor2.push({
              node_id: node_id++,
            })
          }

          breaked = true
          break
        }

        if (instr instanceof Array) {
          walk(instr, stack, dip_top, graph_cursor)
          continue
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

          const [stack_true, stack_false] = clone([stack, stack])
          const breaked1 = walk(instr.args[0], stack_true, dip_top, g.branchs.true)
          const breaked2 = walk(instr.args[1], stack_false, dip_top, g.branchs.false)

          if (!breaked1) {
            node_mapping[node_id] = {
              name: 'end_true',
              value: clone(stack_true)
            }
            g.branchs.true.push({
              node_id: node_id++
            })
          }

          if (!breaked2) {
            node_mapping[node_id] = {
              name: 'end_false',
              value: clone(stack_false)
            }
            g.branchs.false.push({
              node_id: node_id++,
            })
          }

          branchs.push([stack_true, g.branchs.true])
          branchs.push([stack_false, g.branchs.false])

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

          const breaked1 = walk(instr.args[0], left_stack, dip_top, g.branchs.left)
          const breaked2 = walk(instr.args[1], right_stack, dip_top, g.branchs.right)

          if (!breaked1) {
            node_mapping[node_id] = {
              name: 'end_left',
              value: clone(left_stack)
            }
            g.branchs.left.push({
              node_id: node_id++
            })
          }

          if (!breaked2) {
            node_mapping[node_id] = {
              name: 'end_right',
              value: clone(right_stack)
            }
            g.branchs.right.push({
              node_id: node_id++
            })
          }

          branchs.push([left_stack, g.branchs.left])
          branchs.push([right_stack, g.branchs.right])

        } else if (instr.prim === 'DUP') {
          stack.splice(dip_top, 0, clone(stack[dip_top]))

        } else if (instr.prim === 'DROP') {
          stack.splice(dip_top, 1)
          
        } else if (instr.prim === 'SWAP') {
          const temp = stack[dip_top]
          stack[dip_top] = stack[dip_top + 1]
          stack[dip_top + 1] = temp

        } else if (instr.prim === 'ADDRESS') {
          stack[dip_top] = {
            kind: 'address',
            value: stack[dip_top]
          }

        } else if (instr.prim === 'EXEC') {
          stack.splice(dip_top, 1)
          const lambda_fn = stack[dip_top]
          stack[dip_top] = {
            kind: lambda_fn.return.kind,
            value: `exec ${lambda_fn.value} -> ` + getId(lambda_fn.return.kind)
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
            children: []
          })

        } else if (instr.prim === 'UNIT') {
          stack.splice(dip_top, 0, {
            kind: 'unit',
            value: 'Unit'
          })

        } else if (instr.prim === 'FAILWITH') {
          stack[dip_top] = {
            kind: 'fail',
            value: stack[dip_top]
          }

        } else if (instr.prim === 'CAR') {
          stack[dip_top] = stack[dip_top].children[0]

        } else if (instr.prim === 'CDR') {
          stack[dip_top] = stack[dip_top].children[1]

        } else if (instr.prim === 'DIP') {
          walk(instr.args, stack, dip_top + 1)

        } else if (instr.prim === 'PUSH') {
          stack.splice(dip_top, 0, {
            kind: instr.args[0].prim,
            value: Object.values(instr.args[1])[0]
          })

        } else if (instr.prim === 'AMOUNT') {
          stack.splice(dip_top, 0, {
            kind: 'mutez',
            value: 'TX_AMOUNT'
          })

        } else if (instr.prim === 'COMPARE') {
          stack.splice(dip_top, 0, {
            kind: 'compare',
            value: stack.splice(dip_top, 2)
          })

        } else if (instr.prim === 'EQ') {
          stack.splice(dip_top, 0, {
            kind: 'bool',
            symbol: '==',
            value: stack.splice(dip_top, 1)[0]
          })

        } else {
          throw `unhandled instruction: ${instr.prim}`
        }
        
      }

      return breaked
    }

    node_mapping[node_id] = {
      name: 'start',
      value: clone(this.stack)
    }
    const graph = [{
      node_id: node_id++,
    }]
    walk(this.code[0], clone(this.stack), 0, graph)

    return {
      graph_tree: graph,
      node_mapping
    }
  }

  
}


