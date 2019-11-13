// @flow

import type { EType } from './elem'
import { Element, ElementSet } from './elem'
import { instrs } from './instr'

// const extended_types = ['lambda', 'pair', 'or', 'option', 'list', 'map', 'big_map', 'set', 'contract']

export class Contract {
  stack : Array<Element>
  code : Array<Object>

  constructor(contract_raw : Array<Object>) {
    const contract = {}
    contract_raw.forEach(item => {
      const key = item.prim
      contract[key] = item.args
    })

    this.code = contract.code[0]
    this.stack = [new Element({
      t: ['pair'].concat(this.readType(contract.parameter[0]), this.readType(contract.storage[0])),
      children: [
        this.mockElements(contract.parameter[0], 'parameter'),
        this.mockElements(contract.storage[0], 'storage')
      ]
    })]
  }

  readType(t : Object) : EType {
    if (t.args instanceof Array) {
      return [t.prim].concat(t.args.map(x => this.readType(x)))
    } else {
      return [t.prim]
    }
  }

  mockElements(t : Object, field : 'parameter' | 'storage' | 'generate' = 'generate') {
    return new Element({
      t: this.readType(t),
      annots: t.annots,
      children: t.args ? t.args.map(x => this.mockElements(x, field)) : []
    }, field)
  }

  createElements(t : Object, v : Object) {
    return new Element(
      v.args instanceof Array ?
      {
        t: this.readType(t),
        annots: v.annots,
        children: v.args.map((x, i) => this.createElements(t.args[i], x))
      } : {
        t: this.readType(t),
        value: Object.values(v)[0]
      }
    )
  }

  walkCode(code : Array<Object>, stack : Array<Element>, dip_top : number) {
    const res = {dip_top, stack}
    code.forEach(instr => {
      if (!(instr.prim in instrs)) {
        debugger
        throw `Unhandled instr: ${instr.prim}`
      }

      instrs[instr.prim].call(res, instr, this)
    })
  }

  walkToExit() {
    this.walkCode(this.code, this.stack, 0)
    console.log(this.stack[0].getVal())
    console.log(this.stack[0])
  }
}