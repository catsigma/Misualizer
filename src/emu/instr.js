// @flow

import type { Contract } from './contract'
import { Element, ElementSet, Continuation } from './elem'

export const instrs = {
  CAR() {
    this.stack[this.dip_top] = this.stack[this.dip_top].children[0]
  },
  PUSH(instr : Object, contract : Contract) {
    this.stack.splice(this.dip_top, 0, contract.createElements(instr.args[0], instr.args[1]))
  },
  ADD(instr : Object) {
    const [a, b] = this.stack.splice(this.dip_top, 2)
    const kind_set = new Set([a, b].map(x => x.t[0]))
    const kind = 
      kind_set.has('timestamp') ? 'timestamp' : 
      kind_set.has('int') ? 'int' :
      kind_set.has('mutez') ? 'mutez' : 'nat'

    this.stack.splice(this.dip_top, 0, new Element({
      t: [kind],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [a, b])
    }))
  },
  NIL(instr : Object, contract : Contract) {
    this.stack.splice(this.dip_top, 0, new Element({
      t: ['list', contract.readType(instr.args[0])],
      annots: instr.annots
    }))
  },
  PAIR(instr : Object) {
    const elems = this.stack.splice(this.dip_top, 2)
    this.stack.splice(this.dip_top, 0, new Element({
      t: ['pair'].concat(elems.map(x => x.t)),
      annots: instr.annots,
      children: elems
    }))
  }
}