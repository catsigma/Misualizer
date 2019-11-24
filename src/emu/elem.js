// @flow

import { t_reprs, reprs } from './repr'

const getId = (() => {
  const mem = {
    parameter: 0,
    storage: 0,
    generate: 0,
    fake: 0
  }

  return (field? : 'parameter' | 'storage' | 'generate' | 'fake') => {
    if (!field)
      return ''

    mem[field]++

    return ({
      parameter: 'P',
      storage: 'S',
      generate: 'G',
      fake: 'F'
    })[field] + mem[field]
  }
})()

export class Continuation {
  stack : Array<Element>
  operation : string

  constructor(operation: string, stack: Array<Element>) {
    this.operation = operation,
    this.stack = stack
  }

  getVal() {
    if (!(this.operation in reprs)) 
      throw `Unhandled repr: ${this.operation}`

    return reprs[this.operation].call(this)
  }

  getStackVal(index : number) {
    return this.stack[index].getVal()
  }

  getStackVals(from : number, to : number) : Array<string> {
    return this.stack.slice(from, to).map(x => x.getVal())
  }

  isConcrate(...indexes : Array<number>) {
    return indexes.map(index => this.stack[index]).reduce((acc, x) => acc && !isNaN(parseInt(x)), true)
  }

  clone() {
    return new Continuation(this.operation, this.stack.map(x => x.clone()))
  }
}

export type EType = Array<string | EType>

export class Element {
  t: EType
  children: Array<Element>
  annots: Array<string>
  value : string
  continuation : null | Continuation
  state: string
  instr: null | Object
  is_concrate : bool

  static getType(t : EType | string) : string {
    if (t instanceof Array) {
      return t.length === 1 ? t[0].toString() : `(${t.map(x => Element.getType(x)).join(' ')})`
    } else {
      return t
    }
  }

  constructor(params : Object, field? : 'parameter' | 'storage' | 'generate' | 'fake') {
    this.t = []
    this.children = []
    this.annots = []
    this.value = getId(field)
    this.continuation = null
    this.state = 'default'
    this.instr = null
    this.is_concrate = params.value !== undefined ? true : false

    Object.assign(this, params)
  }


  getVal() {
    if (typeof this.t[0] === 'string' && this.t[0] in t_reprs) {
      return t_reprs[this.t[0]].call(this)
    } else if (this.continuation)
      return this.continuation.getVal()
    else if (this.annots && this.annots.length)
      return this.annots[0] + `:${Element.getType(this.t)}`
    else if (this.t[0] === 'string')
      return (this.value || '""') + `:${Element.getType(this.t)}`
    else if (this.value)
      return this.value + `:${Element.getType(this.t)}`
    else {
      debugger
      throw `Unhandled Element for getVal`
    }
  }

  clone() {
    const json_clone = x => x === undefined ? x : JSON.parse(JSON.stringify(x))
    return new Element({
      t: json_clone(this.t),
      children: this.children.map(x => x.clone()),
      annots: json_clone(this.annots),
      value : json_clone(this.value),
      continuation : this.continuation ? this.continuation.clone() : null,
      state: this.state,
      instr: this.instr,
      is_concrate : this.is_concrate
    })
  }
}
