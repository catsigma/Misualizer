// @flow

import type { Stack, Contract } from './contract'
import { Element, Continuation } from './elem'

export const instrs = {
  CAR(stack : Stack, instr : Object) {
    stack.replace(x => x.children[0])
    return stack
  },
  CDR(stack : Stack, instr : Object) {
    stack.replace(x => x.children[1])
    return stack
  },
  PUSH(stack : Stack, instr : Object) {
    stack.insert(this.createElements(instr.args[0], instr.args[1]))
    return stack
  },
  ADD(stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    const kind_set = new Set([a, b].map(x => x.t[0]))
    const kind = 
      kind_set.has('timestamp') ? 'timestamp' : 
      kind_set.has('int') ? 'int' :
      kind_set.has('mutez') ? 'mutez' : 'nat'

    stack.insert(new Element({
      t: [kind],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [a, b])
    }))
    return stack
  },
  NIL(stack : Stack, instr : Object) {
    stack.insert(new Element({
      t: ['list', this.readType(instr.args[0])],
      annots: instr.annots
    }))
    return stack
  },
  PAIR(stack : Stack, instr : Object) {
    const elems = stack.drop(2)
    stack.insert(new Element({
      t: ['pair'].concat(elems.map(x => x.t)),
      annots: instr.annots,
      children: elems
    }))

    return stack
  },
  IF(stack : Stack, instr : Object) {
    const [condition] = stack.drop(1)

    if (condition.is_concrate) {
      if (condition.value === 'True') {
        return this.walkCode(instr.args[0], [stack.clone()])
      } else if (condition.value === 'False') {
        return this.walkCode(instr.args[1], [stack.clone()])
      } else {
        throw `Invalid condition in 'if': ${condition.value}`
      }
    } else {
      const stacks1 = this.walkCode(instr.args[0], [stack.clone()])
      const stacks2 = this.walkCode(instr.args[1], [stack.clone()])
      return stacks1.concat(stacks2)
    }
  },
  SOME(stack : Stack, instr : Object) {
    stack.replace(x => new Element({
      t: ['option', x.t],
      children: [x],
      annots: instr.annots
    }, 'generate'))
    return stack
  },
  MAP(stack : Stack, instr : Object) {
    const [map_data] = stack.drop(1)
    if (map_data.children.length) {
      map_data.children = map_data.children.map(child => {
        const cloned_stack = stack.clone()
        cloned_stack.insert(child)
        const [s] = this.walkCode(instr.args[0], [cloned_stack])
        const [result] = s.drop(1)
        return result
      })
    } else {
      map_data.continuation = new Continuation(instr.prim, [map_data])
    }
    stack.insert(map_data)
    return stack
  },
  FAILWITH(stack : Stack, instr : Object) {
    stack.replace(x => new Element({
      t: ['fail'],
      children: [x],
      annots: instr.annots
    }))
    return stack
  },
  DUP(stack : Stack, instr : Object) {
    stack.insert(stack.top().clone())
    return stack
  },
  DIP(stack : Stack, instr : Object) {
    const level = instr.args[0].int ? parseInt(instr.args.shift().int) : 1
    const prev_dip_top = stack.dip_top
    stack.dip_top += level
    const stacks = this.walkCode(instr.args[0], [stack])
    stacks.forEach(stack => stack.dip_top = prev_dip_top)
    return stacks
  },
  NOW(stack : Stack, instr : Object) {
    stack.insert(new Element({
      t: ['timestamp'],
      annots: instr.annots,
      value: 'NOW'
    }))
    return stack
  },
  COMPARE(stack : Stack, instr : Object) {
    stack.insert(new Element({
      t: ['int'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, stack.drop(2))
    }))
    return stack
  },
  GT(stack : Stack, instr : Object) {
    stack.insert(new Element({
      t: ['bool'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, stack.drop(1))
    }))
    return stack
  }
}