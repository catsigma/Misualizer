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
  DROP(stack : Stack, instr : Object) {
    stack.drop(1)
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
  IF_LEFT(stack : Stack, instr : Object) {
    const [condition] = stack.drop(1)

    if (condition.raw === 'unknown') {
      const clone1 = stack.clone()
      const clone2 = stack.clone()
      clone1.pushCond(condition, '👈')
      clone2.pushCond(condition, '👉')

      clone1.insert(condition.children[0])
      clone2.insert(condition.children[1])
      const stacks1 = this.walkCode(instr.args[0], [clone1])
      const stacks2 = this.walkCode(instr.args[1], [clone2])
      return stacks1.concat(stacks2)

    } else if (condition.raw === 'left') {
      stack.pushCond(condition, '👈')
      stack.insert(condition.children[0])
      return this.walkCode(instr.args[0], [stack])

    } else if (condition.raw === 'right') {
      stack.pushCond(condition, '👉')
      stack.insert(condition.children[1])
      return this.walkCode(instr.args[1], [stack])

    } else {
      debugger
      throw `Invalid condition.raw in IF_LEFT: ${condition.raw || ''}`
    }
  },
  IF_NONE(stack : Stack, instr : Object) {
    const [condition] = stack.drop(1)

    if (condition.children.length) {
      stack.pushCond(condition, '🈶')
      stack.insert(condition.children[0])
      return this.walkCode(instr.args[1], [stack])

    } else if (condition.raw === 'none') {
      stack.pushCond(condition, '🈚')
      return this.walkCode(instr.args[0], [stack])

    } else if (condition.raw === 'unknown') {
      const clone1 = stack.clone()
      const clone2 = stack.clone()
      clone1.pushCond(condition, '🈚')
      clone2.pushCond(condition, '🈶')

      clone2.insert(new Element({
        t: condition.t[1] instanceof Array ? condition.t[1] : [condition.t[1]],
        continuation: condition.continuation
      }, 'generate'))
      const stacks1 = this.walkCode(instr.args[0], [clone1])
      const stacks2 = this.walkCode(instr.args[1], [clone2])
      return stacks1.concat(stacks2)
      
    } else 
      throw `Invalid condition.raw in IF_NONE: ${condition.raw || ''}`
  },
  IF(stack : Stack, instr : Object) {
    const [condition] = stack.drop(1)
    
    if (condition.is_concrate) {
      if (condition.value === 'True') {
        stack.pushCond(condition, '✔️')
        return this.walkCode(instr.args[0], [stack])
      } else if (condition.value === 'False') {
        stack.pushCond(condition, '❌')
        return this.walkCode(instr.args[1], [stack])
      } else {
        throw `Invalid condition in 'if': ${condition.value}`
      }
    } else {
      const clone1 = stack.clone()
      const clone2 = stack.clone()
      clone1.pushCond(condition, '✔️')
      clone2.pushCond(condition, '❌')

      const stacks1 = this.walkCode(instr.args[0], [clone1])
      const stacks2 = this.walkCode(instr.args[1], [clone2])
      return stacks1.concat(stacks2)
    }
  },
  SOME(stack : Stack, instr : Object) {
    stack.replace(x => new Element({
      t: ['option', x.t],
      children: [x],
      annots: instr.annots,
      raw: 'some'
    }, 'generate'))
    return stack
  },
  NONE(stack : Stack, instr : Object) {
    stack.insert(new Element({
      t: ['option', this.readType(instr.args[0])],
      children: [],
      annots: instr.annots,
      value: 'NONE',
      raw: 'none'
    }))
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
  DIG(stack : Stack, instr : Object) {
    const nth = parseInt(instr.args[0].int)
    stack.insert(stack.dropAt(nth))
    return stack
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
    stack.insert(new Element({
      t: ['bool'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, stack.drop(1))
    }))
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
  BALANCE(stack : Stack, instr : Object) {
    stack.insert(new Element({
      t: ['mutez'],
      annots: instr.annots,
      value: 'BALANCE'
    }))
    return stack
  },
  SELF(stack : Stack, instr : Object) {
    const parameter_t = this.stack.top().t[1]
    stack.insert(new Element({
      t: ['contract', parameter_t],
      annots: instr.annots,
      value: 'SELF'
    }))
    return stack
  },
  SWAP(stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    stack.insert(a)
    stack.insert(b)
    return stack
  },
  CHAIN_ID(stack : Stack, instr : Object) {
    stack.insert(new Element({
      t: ['chain_id'],
      annots: instr.annots,
      value: 'CHAIN_ID'
    }))
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
  },
  PACK(stack : Stack, instr : Object) {
    stack.replace(x => new Element({
      t: ['bytes'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  CHECK_SIGNATURE(stack : Stack, instr : Object) {
    stack.insert(new Element({
      t: ['bool'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, stack.drop(3))
    }))
    return stack
  },
  EXEC(stack : Stack, instr : Object) {
    const [arg, lambda] = stack.drop(2)
    const raw = lambda.raw || {args: []}

    if (raw.args.length > 2) {
      stack.insert(arg)
      return this.walkCode(raw.args[2], [stack])
    }

    stack.insert(new Element({
      t: lambda.t[2],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [arg, lambda])
    }))
    return stack
  },
  LAMBDA(stack : Stack, instr : Object) {
    stack.insert(new Element({
      t: ['lambda', this.readType(instr.args[0]), this.readType(instr.args[1])],
      annots: instr.annots,
      raw: instr
    }))
    return stack
  },
  CONCAT(stack : Stack, instr : Object) {
    const [item] = stack.drop(1)
    if (item.t[0] === 'list') {
      stack.insert(new Element({
        t: [item.t[1]],
        annots: instr.annots,
        continuation: new Continuation(instr.prim, [item])
      }))
      return stack
    } else {
      const [item2] = stack.drop(1)
      stack.insert(new Element({
        t: [item.t[0]],
        annots: instr.annots,
        continuation: new Continuation(instr.prim, [item, item2])
      }))
      return stack
    }
  },
  CONTRACT(stack : Stack, instr : Object) {
    const [address] = stack.drop(1)
    stack.insert(new Element({
      t: ['option', ['contract', this.readType(instr.args[0])]],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [address]),
      raw: 'unknown'
    }))
    return stack
  },
  CREATE_CONTRACT(stack : Stack, instr : Object) {
    const args = stack.drop(3)
    stack.insert(new Element({
      t: ['address'],
      continuation: new Continuation(instr.prim, args)
    }, 'generate'))

    stack.insert(new Element({
      t: ['operation'],
      continuation: new Continuation(instr.prim, args)
    }))

    return stack
  },
  MEM(stack : Stack, instr : Object) {
    const [item, group] = stack.drop(2)

    const items = new Set(group.children.map(x => x.value))

    if (items.has(item)) {
      stack.insert(new Element({
        t: ['bool'],
        annots: instr.annots,
        value: 'True'
      }))
    } else {
      stack.insert(new Element({
        t: ['bool'],
        annots: instr.annots,
        continuation: new Continuation(instr.prim, [item, group])
      }))
    }

    return stack
  },
  UPDATE(stack : Stack, instr : Object) {
    const args = stack.drop(3)
    if (args[2].t[0] === 'set') {
      const [item, is_insert, group] = args
      const index = group.children.indexOf(item)

      if (is_insert.value === 'True') {
        if (index === -1)
          group.children.push(item)
      } else if (is_insert.value === 'False') {
        if (index > -1)
          group.children.splice(index, 1)
      } else {
        group.continuation = new Continuation(instr.prim, args)
      }
      stack.insert(group)
      return stack

    } else {
      const [key, value, group] = args
      const group_keys = group.children.map(x => x.children[0])
      const index = group_keys.indexOf(key)

      if (index > -1) {
        group.children[index].children = [key, value]
      } else {
        group.children.push(new Element({
          t: ['elt'],
          children: [key, value]
        }))
      }
      stack.insert(group)
      return stack

    }
  }
}