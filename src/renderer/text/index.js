// @flow

import { Element } from '../../emu/elem'
import { Stack } from '../../emu/contract'
import { t_reprs, instr_reprs } from '../repr'

export class TextRenderer {
  stack : Stack
  constructor(stack : Stack) {
    this.stack = stack
  }

  render() {
    return `[${this.stack.stack.map(elem => this.renderElement(elem)).join(', ')}]`
  }

  renderElement(elem : Element, level : number = -1) : string {
    level++

    if (elem.instr) {
      if (instr_reprs[elem.instr])
        return `${instr_reprs[elem.instr](elem, (elem) => this.renderElement(elem, level))}`

      return `${elem.instr}(${elem.subs.map(x => this.renderElement(x, level)).join(', ')})` 
    } else {
      const t = elem.t[0].toString()

      if (t_reprs[t]) {
        return t_reprs[t](elem, (elem) => this.renderElement(elem, level))
      } else if (elem.annots.length) {
        return elem.annots[0] + ':' + elem.t[0].toString()
      } else if (elem.value !== null) {
        return elem.value
      } else {
        debugger
        throw `renderElement / unhandled type: ${t}`
      }
    }
  }
}