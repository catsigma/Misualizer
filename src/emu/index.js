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
          return {
            kind: 'list',
            // t: inside_value[0].prim,
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
    console.log('start', clone(this.stack))

    const walk = (code_instrs : Array<Object>, stacks : Array<Array<Object>>, dip_top : number) => {

      code_instrs.forEach(instr => {
        if (instr instanceof Array) {
          walk(instr, stacks, dip_top)
          return;
        }

        if (instr.prim === 'IF') {
          console.log('from', clone(stacks))
          stacks.forEach(stack => {
            stack.splice(dip_top, 1)
          })
          console.log('to', clone(stacks))

          const stack1 = walk(instr.args[0], clone(stacks), dip_top)
          const stack2 = walk(instr.args[1], clone(stacks), dip_top)

          stacks = stack1.concat(stack2)

        } else if (instr.prim === 'IF_LEFT') {
          console.log('from', clone(stacks))
          const [left_stacks, right_stacks] = clone([stacks, stacks])
          left_stacks.forEach(stack => {
            stack[dip_top] = stack[dip_top].children[0]
          })
          right_stacks.forEach(stack => {
            stack[dip_top] = stack[dip_top].children[1]
          })
          console.log('to left', clone(left_stacks))
          console.log('to right', clone(right_stacks))

          const stack1 = walk(instr.args[0], left_stacks, dip_top)
          const stack2 = walk(instr.args[1], right_stacks, dip_top)

          stacks = stack1.concat(stack2)

        } else if (instr.prim === 'DUP') {
          stacks.forEach(stack => {
            stack.splice(dip_top, 0, clone(stack[dip_top]))
          })

        } else if (instr.prim === 'DROP') {
          stacks.forEach(stack => {
            stack.splice(dip_top, 1)
          })
          
        } else if (instr.prim === 'SWAP') {
          stacks.forEach(stack => {
            const temp = stack[dip_top]
            stack[dip_top] = stack[dip_top + 1]
            stack[dip_top + 1] = temp
          })

        } else if (instr.prim === 'ADDRESS') {
          stacks.forEach(stack => {
            stack[dip_top] = {
              kind: 'address',
              value: stack[dip_top]
            }
          })

        } else if (instr.prim === 'EXEC') {
          stacks.forEach(stack => {
            stack.splice(dip_top, 1)
            const lambda_fn = stack[dip_top]
            stack[dip_top] = {
              kind: lambda_fn.return.kind,
              value: getId(lambda_fn.return.kind)
            }
          })

        } else if (instr.prim === 'IMPLICIT_ACCOUNT') {
          stacks.forEach(stack => {
            stack[dip_top] = {
              kind: 'contract unit',
              value: stack[dip_top]
            }
          })

        } else if (instr.prim === 'SENDER') {
          stacks.forEach(stack => {
            stack.splice(dip_top, 0, {
              kind: 'address',
              value: 'SENDER'
            })
          })

        } else if (instr.prim === 'PAIR') {
          stacks.forEach(stack => {
            stack.splice(dip_top, 0, {
              kind: 'pair',
              value: stack.splice(dip_top, 2)
            })
          })

        } else if (instr.prim === 'NIL') {
          const lst_t = instr.args[0].prim
          stacks.forEach(stack => {
            stack.splice(dip_top, 0, {
              kind: 'list',
              t: lst_t,
              value: []
            })
          })

        } else if (instr.prim === 'UNIT') {
          stacks.forEach(stack => {
            stack.splice(dip_top, 0, {
              kind: 'unit',
              value: 'Unit'
            })
          })

        } else if (instr.prim === 'FAILWITH') {
          stacks.forEach(stack => {
            stack[dip_top] = {
              kind: 'fail',
              value: stack[dip_top]
            }
          })
          stacks = []

        } else if (instr.prim === 'CAR') {
          stacks.forEach(stack => {
            stack[dip_top] = stack[dip_top].children[0]
          })

        } else if (instr.prim === 'CDR') {
          stacks.forEach(stack => {
            stack[dip_top] = stack[dip_top].children[1]
          })

        } else if (instr.prim === 'DIP') {
          walk(instr.args, stacks, dip_top + 1)

        } else if (instr.prim === 'PUSH') {
          stacks.forEach(stack => {
            stack.splice(dip_top, 0, {
              kind: instr.args[0].prim,
              value: Object.values(instr.args[1])[0]
            })
          })

        } else if (instr.prim === 'AMOUNT') {
          stacks.forEach(stack => {
            stack.splice(dip_top, 0, {
              kind: 'mutez',
              value: 'TX_AMOUNT'
            })
          })

        } else if (instr.prim === 'COMPARE') {
          stacks.forEach(stack => {
            stack.splice(dip_top, 0, {
              kind: 'compare',
              value: stack.splice(dip_top, 2)
            })
          })

        } else if (instr.prim === 'EQ') {
          stacks.forEach(stack => {
            stack.splice(dip_top, 0, {
              kind: 'bool',
              value: stack.splice(dip_top, 1)[0]
            })
          })

        } else {
          throw `unhandled instruction: ${instr.prim}`
        }
        
      })

      return stacks
    }

    const stacks = walk(this.code[0], [clone(this.stack)], 0)
    return stacks
  }

  
}


