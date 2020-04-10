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
  is_dead : boolean

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
    this.is_dead = false
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

  isFailed() {
    if (this.items[0] && this.items[0].t[0] === 'fail')
      return true
    else
      return false
  }

  clone() {
    return new Stack(this.cursor, this.items.map(x => x.clone()), this.path.slice(), this.env, this.attached)
  }

  static checkCondBool(cond : StackItem) {
    return true
  }

  setDeadFlag(instr : string, cond : StackItem) {
    const top = this.top()

    const check_mapping = {
      'IF_LEFT.0'() {
        if (cond.instr === 'Right') return true
      },
      'IF_LEFT.1'() {
        if (cond.instr === 'Left') return true
      },
      'LOOP_LEFT.0'() {
        if (cond.instr === 'Right') return true
      },
      'LOOP_LEFT.1'() {
        if (cond.instr === 'Left') return true
      },
      'IF_NONE.0'() {
        if (cond.instr === 'Some') return true
      },
      'IF_NONE.1'() {
        if (cond.instr === 'None') return true
      },
      'IF.0'() {
        if (!Stack.checkCondBool(cond)) return true
      },
      'IF.1'() {
        if (Stack.checkCondBool(cond)) return true
      },
      'IF_CONS.0'() {
        if (!cond.instr && !cond.subs.length) return true
      },
      'IF_CONS.1'() {
        if (!cond.instr && cond.subs.length) return true
      }
    }

    if (!top)
      throw `empty stack top`

    if (!(instr in check_mapping))
      throw `unhandled checking instr: ${instr}`

    const result = check_mapping[instr].call(this)
    if (result)
      this.is_dead = true
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
        return item.getSub({index: 0, instr: 'Left'}, {index: 0}) 
            || item.getSub({index: 0, instr: 'Left|Right'}, {index: 0}) 
            || item
      },
      'IF_LEFT.RIGHT'(item : StackItem) {
        return item.getSub({index: 0, instr: 'Right'}, {index: 0}) 
            || item.getSub({index: 0, instr: 'Left|Right'}, {index: 1}) 
            || item
      },
      CAR(item : StackItem) {
        return item.getSub({index: 0, t: 'pair', instr: ''}, {index: 0, count: 2}) || item
      },
      CDR(item : StackItem) {
        return item.getSub({index: 0, t: 'pair', instr: ''}, {index: 1, count: 2}) || item
      },
      'IF_NONE.SOME'(item : StackItem) {
        return item.getSub({index: 0, instr: 'Some', t: 'option'}, {index: 0}) 
            || item.getSub({index: 0, instr: 'SOME', t: 'option'}, {index: 0}) 
            || item
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