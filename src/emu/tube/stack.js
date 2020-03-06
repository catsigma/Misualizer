// @flow

type VType = Array<string | VType>

export class Stack {
  cursor : number
  items : StackItem[]
  path : number[]

  constructor() {
    this.cursor = 0
    this.items = []
    this.path = []
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
}