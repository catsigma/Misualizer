// @flow

import type { EType } from './elem'
import { Element } from './elem'
import { instrs } from './instr'

const t_keep_args = new Set(
  ['lambda', 'option', 'list', 'map', 'big_map', 'set', 'contract']
)
const elt_types = new Set(
  ['map', 'big_map']
)

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
    if (this.stack.indexOf(undefined) > -1) {
      debugger
      throw `Error stack item found: undefined`
    } else if (this.stack.some(x => x.t[0] === 'fail')) {
      return true
    }

    return false
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
      throw `Error when stack drops element at index:${index}`

    return result
  }

  insert(elem : Element) {
    this.stack.splice(this.dip_top, 0, elem)
  }
  insertAt(index : number, elem : Element) {
    this.stack.splice(this.dip_top + index, 0, elem)
  }

  pushCond(elem : Element, cond : string | Element => void) {
    const cloned = elem.clone()
    if (typeof cond === 'string') {
      cloned.state = cond
    } else {
      cond(cloned)
    }
    this.conditions.push(cloned)
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
  with_fake_elems : bool

  constructor(contract_raw : Array<Object>, with_fake_elems : bool = true) {
    const contract = {}
    contract_raw.forEach(item => {
      const key = item.prim
      contract[key] = item.args
    })
    
    this.with_fake_elems = with_fake_elems
    this.code = contract.code[0]
    this.stack = new Stack([new Element({
      t: ['pair', this.readType(contract.parameter[0]), this.readType(contract.storage[0])],
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
  fallbackType(t : EType | string) : Object {
    if (typeof t === 'string')
      return {prim: t}

    if (t.length > 1) {
      return {
        prim: t[0],
        args: t.slice(1).map((x : string | EType) => this.fallbackType(x))
      }
    } else {
      return {prim: t[0]}
    }
  }

  mockInsideElements(t : Object) {
    if (!this.with_fake_elems) //TODO: remove this
      return []
      
    if (t.prim === 'list' || t.prim === 'set') {
      return [this.mockElements(t.args[0], 'fake')]
    } else if (t.prim === 'map' || t.prim === 'big_map') {
      return [this.mockElements({prim: 'elt', args: t.args}, 'fake')]
    } else {
      return []
    }
  }

  mockElements(t : Object, field : 'parameter' | 'storage' | 'generate' | 'fake' = 'generate') {
    return new Element({
      t: this.readType(t),
      annots: t.annots,
      children: t_keep_args.has(t.prim) ? this.mockInsideElements(t) : t.args ? t.args.map(x => this.mockElements(x, field)) : [],
      instr: t.prim === 'lambda' ? t : null
    }, field)
  }

  createElements(t : Object, v : Object) {
    let result = new Element(
      elt_types.has(t.prim) ?
      {
        t: this.readType(t),
        children: v.map((x, i) => this.createElements({prim: 'elt', args: t.args}, x))
      } : v.args instanceof Array ?
      {
        t: this.readType(t),
        annots: v.annots,
        children: v.args.map((x, i) => this.createElements(t.args[i], x))
      } : {
        t: this.readType(t),
        value: Object.values(v)[0]
      }
    )
    
    const t_str = result.t[0].toString()
    if (t_str === 'option') {
      result.state = result.value === 'None' ? 'none' : 'some'
    } else if (t_str === 'or') {
      debugger
    } else if (t_str === 'lambda') {
      result.state = v
    }
    return result
  }

  walkCode(code : Array<Object>, stacks : Array<Stack>) : Array<Stack> {
    const failed_stacks = []
    code.forEach((instr, instr_index) => {
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
        ;(result instanceof Array ? result : [result]).forEach(x => {new_stacks.push(x)})

        // instant check
        new_stacks.forEach(stack => stack.is_failed())
      })
      stacks = new_stacks
    })

    return stacks.concat(failed_stacks)
  }

  logResult(stacks : Array<Stack>) {
    const symbolRender = (t : string | null) => {
      const mapping = {
        true: '✔️',
        false: '❌',
        default2true: '✔️',
        default2false: '❌',

        left: '👈',
        right: '👉',
        default2left: '👈',
        default2right: '👉',

        some: '🈶',
        none: '🈚️',
        default2some: '🈶',
        default2none: '🈚️',

        empty: '🈳',
        non_empty: '🈶',
        default2empty: '🈳',
        default2non_empty: '🈶',
        
        default: '❓'
      }
      
      if (!t || !(t in mapping)) {
        debugger
        throw `Invalid symbol`
      } else
        return mapping[t]
    }

    console.log(`%cStart%c: ${this.stack.at(0).getVal()}`, 'background: #006621; color: white', 'color: black')
    stacks.forEach((stack, index) => {
      const index_len = index.toString().length + 1
      if (stack.is_failed()) {
        const conds = stack.conditions.map(x => `${x.getVal()}${symbolRender(x.state)}`).join(' -> ')
        console.log(`${index}.%cCondition%c: ${conds}`, 'background: #def', 'color: black')
        console.log(`${' '.repeat(index_len)}%cFailure%c: ${stack.at(0).getVal()}`, 'background: #c00; color: white', 'color: black')
      } else {
        const conds = stack.conditions.map(x => `${x.getVal()}${symbolRender(x.state)}`).join(' -> ')
        console.log(`${index}.%cCondition%c: ${conds}`, 'background: #def', 'color: black')
        console.log(`${' '.repeat(index_len)}%cResult%c: ${stack.top().getVal()}`, 'background: #1a0dab; color: white', 'color: black')
      }
    })
  }

  walkToExit() {
    const result_stacks = this.walkCode(this.code, [this.stack.clone()])
    this.logResult(result_stacks)
  }
}