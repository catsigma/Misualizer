import { StackItem } from './stack'

export class DiffValue {
  left : StackItem
  right : StackItem
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

  read() {
    const result = []
    if (this.left)
      result.push(this.left.toString())

    if (this.right && result.length)
      result.push('/')

    if (this.right)
      result.push(this.right.toString())

    return result.join(' ')
  }
}

export function diffStackItem(base : StackItem, left : StackItem, right : StackItem) {
  const walk = (x : StackItem, cursor : StackItem, direction : 'left' | 'right') => {
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