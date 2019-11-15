// @flow

import type { EType } from './elem'
import { Element } from './elem'
import { instrs } from './instr'

// const extended_types = ['lambda', 'pair', 'or', 'option', 'list', 'map', 'big_map', 'set', 'contract']

export class Stack {
  stack : Array<Element>
  dip_top : number
  conditions : Array<Element>

  constructor(stack : Array<Element>) {
    this.stack = stack
    this.dip_top = 0
    this.conditions = []
  }

  length() {
    return this.stack.length
  }
  
  is_failed() {
    return this.stack.length ? 
      this.stack[this.dip_top].t[0] === 'fail' :
      false
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

  insert(elem : Element) {
    this.stack.splice(this.dip_top, 0, elem)
  }

  clone() {
    const result = new Stack(this.stack.map(item => item.clone()))
    result.dip_top = this.dip_top
    result.conditions = this.conditions.map(item => item.clone())
    return result
  }

  getCondVal() {
    return this.conditions.map(x => x.getVal())
  }
}

export class Contract {
  stack : Stack
  code : Array<Object>

  constructor(contract_raw : Array<Object>) {
    const contract = {}
    contract_raw.forEach(item => {
      const key = item.prim
      contract[key] = item.args
    })

    this.code = contract.code[0]
    this.stack = new Stack([new Element({
      t: ['pair'].concat(this.readType(contract.parameter[0]), this.readType(contract.storage[0])),
      children: [
        this.mockElements(contract.parameter[0], 'parameter'),
        this.mockElements(contract.storage[0], 'storage')
      ]
    })])
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

  walkCode(code : Array<Object>, stacks : Array<Stack>) : Array<Stack> {
    const failed_stacks = []
    code.forEach(instr => {
      if (instr instanceof Array) {
        stacks = this.walkCode(instr, stacks)
        return;
      }

      if (!(instr.prim in instrs)) {
        debugger
        throw `Unhandled instr: ${instr.prim}`
      }

      const new_stacks = []
      stacks.forEach(stack => {
        if (stack.is_failed()) {
          failed_stacks.push(stack)
          return;
        }

        const result : Stack | Array<Stack> = instrs[instr.prim].call(this, stack, instr)
        ;(result instanceof Array ? result : [result]).forEach(x => new_stacks.push(x))
      })
      stacks = new_stacks
    })

    return stacks.concat(failed_stacks)
  }

  walkToExit() {
    console.log('start', this.stack.at(0).getVal())
    const result_stacks = this.walkCode(this.code, [this.stack])
    result_stacks.forEach(stack => {
      console.log('final', stack.at(0).getVal())
    })
  }
}