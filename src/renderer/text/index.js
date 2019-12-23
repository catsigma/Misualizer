// @flow

import { Element } from '../../emu/elem'
import { Stack } from '../../emu/contract'
import { renderElement, t_reprs, instr_reprs } from '../repr'
import type { rec_array } from '../repr'


export class TextRenderer {
  stack : Stack
  patterns : Array<Object>
  constructor(stack : Stack, pattern? : Object) {
    this.stack = stack
    this.patterns = pattern ? [pattern, instr_reprs] : [instr_reprs]
  }

  render(elem? : Element) : string {
    const result = elem ? renderElement(elem, this.patterns) : 
        this.stack.stack.map(elem => renderElement(elem, this.patterns))

    console.log(result)
    return this.stringify(result)
  }


  stringify(item : rec_array | string, left : number = 0) : string {
    if (item instanceof Array) {
      if (item.length === 1)
        return this.stringify(item[0])
        
      if (item[0] === 'pair') {
        return `(${this.stringify(item[1][0])}, ${this.stringify(item[1][1])})`
      } else if (item[0] === 'list') {
        if (item[1] instanceof Array)
          return `[${item[1].map(x => this.stringify(x)).join(', ')}]`
      }

      return item.map(x => this.stringify(x)).join(' ')
    }
    
    return item
  }
}