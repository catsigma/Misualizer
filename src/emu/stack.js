// @flow

import { type_mapping, instr_mapping, tToString } from './repr'
import { get_t } from './instr'

type VType = Array<string | VType>

type Env = {
  self: string,
  amount: string,
  balance: string,
  chain_id: string,
  source: string,
  sender: string,
  now: string
}

export class Stack {
  cursor : number
  items : StackItem[]
  path : number[]
  env : Env
  attached : Object

  constructor(cursor : number = 0, items : StackItem[] = [], path : number[] = [], env : Env = {
    self: 'SELF',
    now: 'NOW',
    source: 'SOURCE',
    sender: 'SENDER',
    chain_id: 'CHAIN_ID',
    amount: 'AMOUNT',
    balance: 'BALANCE'
  }, attached : Object = {}) {
    this.cursor = cursor
    this.items = items
    this.path = path
    this.env = env
    this.attached = attached
  }

  toStringLst() {
    return this.items.map<string>(x => x.reduceSelf().toString())
  }

  at(index : number) : StackItem {
    return this.items[index]
  }
  top() {
    return this.items[this.cursor]
  }
  replace(fn : StackItem => StackItem) {
    this.items[this.cursor] = fn(this.items[this.cursor])
  }
  topn(count : number) : StackItem[]  {
    return this.items.slice(this.cursor, this.cursor + count)
  }
  drop(count : number) : StackItem[] {
    return this.items.splice(this.cursor, count)
  }
  dropAt(index : number) : StackItem {
    const [result] = this.items.splice(this.cursor + index, 1)
    if (!result)
      throw `dropAt / error when stack drops element at index:${index}`

    return result
  }
  insert(item : StackItem) {
    this.items.splice(this.cursor, 0, item)
  }
  insertAt(index : number, item : StackItem) {
    this.items.splice(this.cursor + index, 0, item)
  }
  empty() {
    this.cursor = 0
    this.items = []
  }

  is_failed() {
    if (this.items[0] && this.items[0].t[0] === 'fail')
      return true
    else
      return false
  }

  clone() {
    return new Stack(this.cursor, this.items.map(x => x.clone()), this.path.slice(), this.env, this.attached)
  }
}


export class StackItem {
  t : VType
  instr : string
  value : Object
  annots : string[]
  subs : StackItem[]

  constructor(t : VType, annots : string[] = [], instr : string, value : Object = null, subs : StackItem[] = []) {
    this.t = t
    this.annots = annots
    this.instr = instr
    this.value = value
    this.subs = subs
  }

  toString() : string {
    const prefix = this.annots.length ? `#${this.annots[0]}#` : ''
    let surfix = ''

    if (this.instr in instr_mapping)
      surfix = instr_mapping[this.instr](this)
    else if (!this.instr && this.t[0].toString() in type_mapping)
      surfix = type_mapping[this.t[0].toString()](this)
    else if (typeof this.value === 'string' && this.value)
      surfix = this.value
    else if (this.instr && this.subs.length) {
      surfix = `${this.instr}(${this.subs.map(x => x.toString()).join(', ')})`
    } else {
      surfix = tToString(this.t)
    }

    return prefix + surfix
  }

  clone(no_subs : boolean = false) {
    return new StackItem(
      this.t, 
      this.annots,
      this.instr,
      this.value,
      no_subs ? [] : this.subs.map(x => x.clone()))
  }

  reduceSelf() {
    const cloned = this.clone(true)
    const mapping = {
      'IF_LEFT.LEFT'(item : StackItem) {
        return item.getSub({index: 0, instr: 'Left|Right'}, {index: 0}) || item
      },
      'IF_LEFT.RIGHT'(item : StackItem) {
        return item.getSub({index: 0, instr: 'Left|Right'}, {index: 1}) || item
      },
      CAR(item : StackItem) {
        return item.getSub({index: 0, t: 'pair', instr: ''}, {index: 0, count: 2}) || item
      },
      CDR(item : StackItem) {
        return item.getSub({index: 0, t: 'pair', instr: ''}, {index: 1, count: 2}) || item
      },
      'IF_NONE.SOME'(item : StackItem) {
        return item.getSub({index: 0, instr: 'SOME', t: 'option'}, {index: 0}) || item
      }
    }

    cloned.subs = this.subs.map(x => x.reduceSelf())

    if (this.instr in mapping) {
      return mapping[this.instr](cloned)
    } else {
      return cloned
    }
  }

  getSub(...query : {
    index : number,
    t? : string,
    instr? : string,
    count? : number
  }[]) : StackItem | null {
    let cursor = this

    for (let i = 0; i < query.length; i++) {
      const {t, instr, index, count} = query[i]

      if (count && cursor.subs.length !== count)
        return null

      const result = cursor.subs[index]

      if (t && result.t[0] !== t)
        return null

      if (instr !== undefined && result.instr !== instr)
        return null

      cursor = result
    }

    return cursor
  }
}