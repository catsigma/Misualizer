// @flow

type VType = Array<string | VType>

const json_clone = x => JSON.parse(JSON.stringify(x))

export class Stack {
  cursor : number
  items : StackItem[]
  path : number[]

  constructor(cursor : number = 0, items : StackItem[] = [], path : number[] = []) {
    this.cursor = cursor
    this.items = items
    this.path = path
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


  clone() {
    return new Stack(this.cursor, this.items.map(x => x.clone()), this.path.slice())
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

  clone() {
    return new StackItem(
      json_clone(this.t), 
      this.annots.slice(),
      this.instr,
      json_clone(this.value),
      this.subs.map(x => x.clone()))
  }
}