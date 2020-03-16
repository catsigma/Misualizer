// @flow

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

  toString() {
    return `${this.items.map(x => x.toString()).join('\n')}`
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

  toString() {
    if (this.value)
      return this.value

    if (this.instr)
      return `${this.instr}(${this.subs.map(x => x.toString()).join(', ')})`

    if (this.annots.length)
      return `${this.annots[0]}:${this.t[0].toString()}`

    if (this.subs.length)
      return `(${this.subs.map(x => x.toString()).join(', ')})`
  }

  clone() {
    return new StackItem(
      this.t, 
      this.annots.slice(),
      this.instr,
      this.value,
      this.subs.map(x => x.clone()))
  }
}