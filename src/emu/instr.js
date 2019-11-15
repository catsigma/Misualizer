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
  AND(stack : Stack, instr : Object) {
    stack.insert(new Element({
      t: ['bool'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, stack.drop(2))
    }))
    return stack
  },
  CONS(stack : Stack, instr : Object) {
    const [item, lst] = stack.drop(2)
    stack.insert(new Element({
      t: lst.t,
      annots: instr.annots,
      children: lst.children.concat(item)
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
  ITER(stack : Stack, instr : Object) {
    const [item] = stack.drop(1)
    let stacks = [stack]
    if (item.children.length) {
      item.children.forEach(child => {
        stacks.forEach(stack => stack.insert(child))
        stacks = this.walkCode(instr.args[0], stacks)
      })
    } else {
      item.continuation = new Continuation(instr.prim, [item])
    }
    return stacks
  },
  MAP(stack : Stack, instr : Object) {
    const [item] = stack.drop(1)
    const prev_len = stack.length()
    const prev_dip_top = stack.dip_top

    let stacks = [stack]
    if (item.children.length) {
      item.children.forEach(child => {
        stacks.forEach(stack => stack.insert(child))
        stacks = this.walkCode(instr.args[0], stacks)
        stacks.forEach(stack => stack.dip_top += 1)
      })
      stacks.forEach(stack => {
        const cloned_item = item.clone()
        stack.dip_top = prev_dip_top
        cloned_item.children = stack.drop(stack.length() - prev_len)
        stack.insert(cloned_item)
      })
    } else {
      item.continuation = new Continuation(instr.prim, [item])
      stack.insert(item)
    }
    return stacks
  },
  FAILWITH(stack : Stack, instr : Object) {
    stack.replace(x => new Element({
      t: ['fail'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
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
  base_compare(stack : Stack, instr : Object) {
    const result = new Element({
      t: ['bool'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, stack.drop(1))
    })
    stack.insert(result)
    stack.conditions.push(result.clone())
    return stack
  },
  GT(stack : Stack, instr : Object) {
    return instrs.base_compare.call(this, stack, instr)
  },
  EQ(stack : Stack, instr : Object) {
    return instrs.base_compare.call(this, stack, instr)
  },
  GE(stack : Stack, instr : Object) {
    return instrs.base_compare.call(this, stack, instr)
  },
  LE(stack : Stack, instr : Object) {
    return instrs.base_compare.call(this, stack, instr)
  },
  LT(stack : Stack, instr : Object) {
    return instrs.base_compare.call(this, stack, instr)
  },
  NEQ(stack : Stack, instr : Object) {
    return instrs.base_compare.call(this, stack, instr)
  },
  AMOUNT(stack : Stack, instr : Object) {
    stack.insert(new Element({
      t: ['mutez'],
      annots: instr.annots,
      value: 'AMOUNT'
    }))
    return stack
  },
  SWAP(stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    stack.insert(a)
    stack.insert(b)
    return stack
  },
  UNIT(stack : Stack, instr : Object) {
    stack.insert(new Element({
      t: ['unit'],
      annots: instr.annots,
      value: 'UNIT'
    }))
    return stack
  },
  IMPLICIT_ACCOUNT(stack : Stack, instr : Object) {
    stack.insert(new Element({
      t: ['contract', 'unit'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, stack.drop(1))
    }))
    return stack
  },
  TRANSFER_TOKENS(stack : Stack, instr : Object) {
    stack.insert(new Element({
      t: ['operation'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, stack.drop(3))
    }))
    return stack
  }
}