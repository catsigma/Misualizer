// @flow

import { t_reprs, reprs } from './repr'

const getId = (() => {
  const mem = {
    parameter: 0,
    storage: 0,
    generate: 0
  }

  return (field? : 'parameter' | 'storage' | 'generate') => {
    if (!field)
      return ''

    mem[field]++

    return ({
      parameter: 'P',
      storage: 'S',
      generate: 'G'
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
      throw `Unhandeled operation: ${this.operation}`

    return reprs[this.operation].call(this)
  }

  getStackVal(index : number) {
    return this.stack[index].getVal()
  }

  isConcrate(...indexes : Array<number>) {
    return indexes.reduce((acc, x) => acc && x, true)
  }
}

export type EType = Array<string | EType>

export class Element {
  t: EType
  children: Array<Element>
  annots: Array<string>
  value : string
  continuation : null | Continuation
  is_concrate : bool

  constructor(params : Object, field? : 'parameter' | 'storage' | 'generate') {
    this.t = []
    this.children = []
    this.annots = []
    this.value = getId(field)
    this.continuation = null
    this.is_concrate = params.value !== undefined ? true : false

    Object.assign(this, params)
  }

  getType(t : EType | string) : string {
    if (t instanceof Array) {
      return t.length === 1 ? t[0].toString() : `(${t.map(x => this.getType(x)).join(' ')})`
    } else {
      return t
    }
  }

  getVal(no_t : bool = false) {
    let val
    if (this.annots && this.annots.length)
      val = this.annots[0]
    else if (typeof this.t[0] === 'string' && this.t[0] in t_reprs) {
      val = t_reprs[this.t[0]].call(this)
    } else if (this.continuation)
      val = this.continuation.getVal()
    else
      val = this.value

    return val + (no_t ? '' : ':' + this.getType(this.t))
  }
  
}

export class ElementSet {
  elements : Set<Element>
  constructor(elements? : Array<Element>) {
    if (elements)
      this.elements = new Set(elements)
    else
      this.elements = new Set()
  }

  unionElement(elem : Element) {
    this.elements.add(elem)
  }
}