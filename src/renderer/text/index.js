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

    const render_result = this.stringify(result)

    let indent = 0
    let last_index = 0
    const indentations = []
    return render_result.replace(/[\n\r\t]/g, (x, index) => {
      if (x === '\n') {
        indentations.push(indent)
        indent += 2
        return '\n' + ' '.repeat(indent)
      } else if (x === '\t') {
        indent = indentations.pop() + 2
        return '\n' + ' '.repeat(indent)
      } else {
        indent = indentations.pop()
        return '\n' + ' '.repeat(indent + 2)
      }
    })
  }

  stringify(item : rec_array | string) : string {
    if (!item)
      debugger

    if (item instanceof Array) {
      if (item.length === 1)
        return this.stringify(item[0])
        
      if (item[0] === 'pair') {
        return `(${this.stringify(item[1][0])}, ${this.stringify(item[1][1])})`
      } else if (item[0] === 'list') {
        if (item[1] instanceof Array)
          return `[${item[1].map(x => this.stringify(x)).join(', ')}]`
      } else if (item[0] === 'option') {
        return `option<${item[1][0].toString()}>`
      } else if (item[0] === 'if') {
        const else_return = (item.length === 4 ? item[3][0] : item[4][0]) === 'if' ? '\t' : '\r'
        if (item.length === 4)
          return `\nif ${this.stringify(item[1])} then ${this.stringify(item[2])} ${else_return}else ${this.stringify(item[3])}`
        else if (item.length === 5)
          return `\nif ${this.stringify(item[1])} ${this.stringify(item[2])} then ${this.stringify(item[3])} ${else_return}else ${this.stringify(item[4])}`
      } else if (item[0] === 'fail') {
        const reasons = item[2] instanceof Array ? item[2] : [item[2]]
        return `Fail: ${this.stringify(item[1])} / Reason: \n\n${reasons.map(reason => this.stringify(reason)).join(' \r\n-> ')}`
      }

      return `(${item.map(x => this.stringify(x)).join(' ')})` 
    }

    return item.replace(/[\r\n\t]/g, '')
  }
}