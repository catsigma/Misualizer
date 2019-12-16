// @flow

import { Element } from '../../emu/elem'
import { Stack } from '../../emu/contract'
import { reprs } from '../repr'

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
      return `\n${'\t'.repeat(level)}${elem.instr}(${elem.subs.map(x => this.renderElement(x, level)).join(', ')})` 
    } else {
      const t = elem.t[0].toString()

      if (!(reprs[t])) {
        debugger
        throw `renderElement / unhandled type: ${t}`
      }

      return reprs[t](elem, (elem) => this.renderElement(elem, level))
    }
  }
}