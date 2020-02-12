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
      this.instr, json_clone(this.value), this.subs)
  }
}

export class DiffValue {
  left : Element
  right : Element
  direction : 'left' | 'right' | 'both'

  constructor(direction : 'left' | 'right') {
    this.direction = direction
  }

  addDirection(direction : 'left' | 'right') {
    if (this.direction !== direction)
      this.direction = 'both'
  }

  hasValue() {
    return this.left || this.right
  }

  read(fn : Element => string) {
    const result = []
    if (this.left)
      result.push(fn(this.left))

    if (this.right && result.length)
      result.push('/')

    if (this.right)
      result.push(fn(this.right))

    return result.join(' ')
  }
}

export function diffElement(base : Element, left : Element, right : Element) {
  const walk = (x : Element, cursor : Element, direction : 'left' | 'right') => {
    if (cursor.value instanceof DiffValue)
      cursor.value.addDirection(direction)
    else
      cursor.value = new DiffValue(direction)

    if (x.instr === 'Left') {
      walk(x.subs[0], cursor.subs[0], direction)
    } else if (x.instr === 'Right') {
      walk(x.subs[0], cursor.subs[1], direction)
    } else if (x.t[0] === 'pair') {
      walk(x.subs[0], cursor.subs[0], direction)
      walk(x.subs[1], cursor.subs[1], direction)
    } else {
      if (direction === 'left')
        cursor.value.left = x
      else
        cursor.value.right = x
    }
  }
  walk(left, base, 'left')
  walk(right, base, 'right')
  return base
}