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
      throw `Unhandled repr: ${this.operation}`

    return reprs[this.operation].call(this)
  }

  getStackVal(index : number) {
    return this.stack[index].getVal()
  }

  isConcrate(...indexes : Array<number>) {
    return indexes.map(index => this.stack[index]).reduce((acc, x) => acc && x.is_concrate, true)
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
    if (this.annots && this.annots.length)
      return this.annots[0]
    else if (typeof this.t[0] === 'string' && this.t[0] in t_reprs) {
      return t_reprs[this.t[0]].call(this) + (no_t ? '' : ':' + this.getType(this.t))
    } else if (this.continuation)
      return this.continuation.getVal()
    else
      return this.value
  }

  clone() {
    const json_clone = x => x === undefined ? x : JSON.parse(JSON.stringify(x))
    return new Element({
      t: json_clone(this.t),
      children: this.children.map(x => x.clone()),
      annots: json_clone(this.annots),
      value : json_clone(this.value),
      continuation : this.continuation ? this.continuation.clone() : null,
      is_concrate : this.is_concrate
    })
  }
}
