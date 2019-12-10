// @flow

const json_clone = x => x === undefined ? x : JSON.parse(JSON.stringify(x))


export type EType = Array<string | EType>

export class Element {
  id : number
  t : EType
  annots : Array<string>

  instr : string
  value : Object
  subs : Array<Element>

  constructor(
      id : number, t : EType, annots : Array<string> = [], 
      instr : string = '', value : Object = null, subs : Array<Element> = []) {
    this.id = id
    this.t = t
    this.annots = annots

    this.instr = instr
    this.value = value
    this.subs = subs
  }

  clone() {
    return new Element(
      this.id, json_clone(this.t), json_clone(this.annots), 
      this.instr, json_clone(this.value), this.subs.map(x => x.clone()))
  }
}
