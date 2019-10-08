// @flow

function clone(x : Object) {
  return JSON.parse(JSON.stringify(x))
}

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

    this.stack = [['PARAMETER', 'STORAGE']]
    this.op_tree = []
  }


  getMockFromType(input_type : Object) {
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

    const walk = (input : Object) => {
      let inside_value
      if (input.args instanceof Array) {
        if (input.prim === 'lambda') {
          inside_value = {
            parameter: walk(input.args[0]),
            return: walk(input.args[1])
          }
        } if (input.prim === 'contract') {
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
        }
      }

      if (input.prim in prim_mapping) {
        return prim_mapping[input.prim]()
      } else {
        throw input
      }

    }

    return walk(input_type)
  }

  parseCode() {
    this.code.forEach(x => {
      const len = this.stack.length
      if (x.prim === 'DUP') {
        this.op_tree.push(`S${len} = S${len - 1}`)
        this.stack.unshift(clone(this.stack[0]))
      } else if (x.prim === 'CAR') {
        this.op_tree.push(`S${len - 1} = S${len - 1}`)
        this.stack[0] = this.stack[0][0]
      }
    })
  }
}