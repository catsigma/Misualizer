// @flow

import type { EType } from './elem'
import { Element } from './elem'
import { instrs } from './instr'

export class Stack {
  stack : Array<Element>
  dip_top : number

  constructor(stack : Array<Element>) {
    this.stack = stack
    this.dip_top = 0
  }

  length() {
    return this.stack.length
  }
  
  is_failed() {
    if (this.stack.indexOf(undefined) > -1) {
      debugger
      throw `is_failed / error stack item found: undefined`
    } else if (this.stack.some(x => x.t[0] === 'fail')) {
      return true
    }

    return false
  }

  equal(target : Stack) : Array<bool> {
    if (this.stack.length !== target.stack.length)
      throw `equal / the length of two stacks are not equal`

    return this.stack.map((item, index) => {
      return item.id === target.stack[index].id
    })
  }

  combine(target : Stack, contract : Contract, instr : string, annots : Array<string> = []) : Array<Element> {
    return this.equal(target).map((result, index) => {
      const item = this.stack[index]
      if (result)
        return item
      else {
        return contract.newElement(item.t, annots, instr, null, [item, target.stack[index]])
      }
    })
  }

  at(index : number) : Element {
    return this.stack[index]
  }

  top() : Element {
    return this.stack[this.dip_top]
  }

  replace(fn : Element => Element) {
    this.stack[this.dip_top] = fn(this.stack[this.dip_top])
  }

  topn(count : number) : Array<Element>  {
    return this.stack.slice(this.dip_top, this.dip_top + count)
  }

  drop(count : number) : Array<Element> {
    return this.stack.splice(this.dip_top, count)
  }
  dropAt(index : number) : Element {
    const [result] = this.stack.splice(this.dip_top + index, 1)
    if (!result)
      throw `dropAt / error when stack drops element at index:${index}`

    return result
  }

  insert(elem : Element) {
    this.stack.splice(this.dip_top, 0, elem)
  }
  insertAt(index : number, elem : Element) {
    this.stack.splice(this.dip_top + index, 0, elem)
  }

  clone() {
    const result = new Stack(this.stack.map(item => item.clone()))
    result.dip_top = this.dip_top
    return result
  }
}

export class Contract {
  stack : Stack
  code : Array<Object>
  elem_id : {val: number}

  constructor(contract_raw : Array<Object>) {
    const contract = {}
    contract_raw.forEach(item => {
      const key = item.prim
      contract[key] = item.args[0]
    })
    
    this.elem_id = {val: 1}
    this.code = contract.code
    this.stack = new Stack([])
  }

  newElement(
      t : EType, annots : Array<string> = [], 
      instr : string = '', value : Object = null, subs : Array<Element> = []) {
    return new Element(this.elem_id.val++, t, annots, instr, value, subs)
  }

  walkCode(code : Array<Object>, stack : Stack) : Stack {
    code.forEach((instr, instr_index) => {
      if (instr instanceof Array) {
        stack = this.walkCode(instr, stack)
        return;
      }

      if (!(instr.prim in instrs)) {
        debugger
        throw `walkCode / unhandled instr: ${instr.prim}`
      }

      if (stack.is_failed()) {
        return;
      }

      stack = instrs[instr.prim](this, stack, instr)
    })

    return stack
  }

  walkToExit() {
    return this.walkCode(this.code, this.stack.clone())
  }
}