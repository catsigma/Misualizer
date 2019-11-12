// @flow

import { reprs } from './repr'

const getId = (() => {
  const mem = {
    parameter: 0,
    storage: 0,
    generate: 0
  }

  return (field : 'parameter' | 'storage' | 'generate') => {
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

  constructor(params : Object) {
    Object.assign(this, params)
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

export class Element {
  t: Array<string>
  children: Array<Element>
  annots: Array<string>
  value : string
  continuation : null | Continuation
  is_concrate : bool

  constructor(params : Object, field : 'parameter' | 'storage' | 'generate' = 'generate') {
    this.t = []
    this.children = []
    this.annots = []
    this.value = getId(field)
    this.continuation = null
    this.is_concrate = params.value !== undefined ? true : false

    Object.assign(this, params)
  }

  getVal() {
    const t = this.t.length > 1 ? `(${this.t.join(' ')})` : this.t[0]

    if (this.annots && this.annots.length)
      return this.annots[0] + ':' + t
    else if (this.continuation)
      return this.continuation.getVal()
    else
      return this.value
  }
  
}

export class ElementGroup {
  elements : Set<Element>
  constructor(elements? : Array<Element>) {
    if (elements)
      this.elements = new Set(elements)
    else
      this.elements = new Set()
  }

  combineElement(elem : Element) {
    this.elements.add(elem)
  }
}