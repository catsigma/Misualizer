// @flow

import { createStackItem, toVType } from './micheline'
import { Stack, StackItem } from './stack'

const get_t = t => t instanceof Array ? t : [t]

export const instr_mapping = {
  DEBUGGER(stack : Stack, instr : Object) {
    debugger
  },
  DUP(stack : Stack, instr : Object) {
    stack.insert(stack.top().clone())
  },
  CAR(stack : Stack, instr : Object) {
    stack.replace(item => {
      if (item.instr) {
        return new StackItem(get_t(item.t[1]), instr.annots, instr.prim, null, [item])
      } else {
        return item.subs[0]
      }
    })
  },
  CDR(stack : Stack, instr : Object) {
    stack.replace(item => {
      if (item.instr) {
        return new StackItem(get_t(item.t[2]), instr.annots, instr.prim, null, [item])
      } else {
        return item.subs[1]
      }
    })
  },
  CURSOR(stack : Stack, instr : Object) {
    stack.cursor += parseInt(instr.args[0].int)
  },
  IF_LEFT(stack : Stack) {
    const [cond] = stack.drop(1)
    const stack2 = stack.clone()

    stack.insert(new StackItem(get_t(cond.t[1]), [], 'IF_LEFT.0', null, [cond]))
    stack2.insert(new StackItem(get_t(cond.t[2]), [], 'IF_LEFT.1', null, [cond]))

    return [stack, stack2]
  },
  IF(stack : Stack) {
    const [cond] = stack.drop(1)
    const stack2 = stack.clone()

    return [stack, stack2]
  },
  PUSH(stack : Stack, instr : Object) {
    stack.insert(createStackItem(instr.args[0], instr.args[1]))
  },
  AMOUNT(stack : Stack, instr : Object) {
    stack.insert(new StackItem(['mutez'], instr.annots, '', stack.env.amount, []))
  },
  COMPARE(stack : Stack, instr : Object) {
    stack.insert(new StackItem(['int'], instr.annots, instr.prim, null, stack.drop(2)))
  },
  EQ(stack : Stack, instr : Object) {
    stack.replace(x => new StackItem(['bool'], instr.annots, instr.prim, null, [x]))
  },
  DROP(stack : Stack, instr : Object) {
    const count = instr.args && instr.args[0].int ? parseInt(instr.args[0].int) : 1
    stack.drop(count)
  },
  NIL(stack : Stack, instr : Object) {
    stack.insert(new StackItem(
      ['list', toVType(instr.args[0])], instr.annots, instr.prim, null, []))
  },
  PAIR(stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    stack.insert(new StackItem(
      ['pair', a.t, b.t], instr.annots, '', null, [a, b]))
  },
  UNIT(stack : Stack, instr : Object) {
    stack.insert(new StackItem(['unit'], instr.annots, '', 'Unit', []))
  },
  FAILWITH(stack : Stack, instr : Object) {
    const fail_elem = new StackItem(['fail'], instr.annots, '', null, stack.drop(1))
    stack.empty()
    stack.insert(fail_elem)
  },
  SWAP(stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    stack.insert(a)
    stack.insert(b)
  },
  IMPLICIT_ACCOUNT(stack : Stack, instr : Object) {
    stack.insert(new StackItem(['contract', 'unit'], instr.annots, instr.prim, null, stack.drop(1)))
  },
  ADDRESS(stack : Stack, instr : Object) {
    stack.replace(x => new StackItem(
      ['address'], instr.annots, instr.prim, null, [x]
    ))
  },
  SENDER(stack : Stack, instr : Object) {
    stack.insert(new StackItem(
      ['address'], instr.annots, '', stack.env.sender, []
    ))
  },
  EXEC(stack : Stack, instr : Object) {
    const [arg, lambda] = stack.drop(2)

    stack.insert(new StackItem(
      get_t(lambda.t[2]), instr.annots, instr.prim, null, [arg, lambda]))
  },
  RENAME(stack : Stack, instr : Object) {
    stack.top().annots = instr.annots
  },
  INT(stack : Stack, instr : Object) {
    stack.replace(x => 
      new StackItem(['int'], instr.annots, instr.prim, null, [x]))
  },
  NEG(stack : Stack, instr : Object) {
    stack.replace(x => 
      new StackItem(['int'], instr.annots, instr.prim, null, [x]))
  },
  ABS(stack : Stack, instr : Object) {
    stack.replace(x => 
      new StackItem(['nat'], instr.annots, instr.prim, null, [x]))
  },
  LSL(stack : Stack, instr : Object) {
    stack.insert(new StackItem(['nat'], instr.annots, instr.prim, null, stack.drop(2)))
  },
  LSR(stack : Stack, instr : Object) {
    stack.insert(new StackItem(['nat'], instr.annots, instr.prim, null, stack.drop(2)))
  },
  EDIV(stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    let t1, t2
    if (a.t[0] === 'mutez') {
      t1 = b.t[0] === 'nat' ? 'mutez' : 'nat'
      t2 = 'mutez'
    } else {
      t1 = a.t[0] === 'nat' && b.t[0] === 'nat' ? 'nat' : 'int'
      t2 = 'nat'
    }

    stack.insert(new StackItem(
      ['option', ['pair', t1, t2]], instr.annots, instr.prim, null, [a, b]))
  },
  MUL(stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    const t_set = new Set([a, b].map(x => x.t[0]))
    const t = t_set.has('mutez') ? 'mutez' : t_set.has('int') ? 'int' : 'nat'

    stack.insert(new StackItem([t], instr.annots, instr.prim, null, [a, b]))
  },
  ADD(stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    const t_set = new Set([a, b].map(x => x.t[0]))
    const t =
      t_set.has('timestamp') ? 'timestamp' : 
      t_set.has('mutez') ? 'mutez' :
      t_set.has('int') ? 'int' : 'nat'

    stack.insert(new StackItem([t], instr.annots, instr.prim, null, [a, b]))
  },
  SUB(stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    const t_set = new Set([a, b].map(x => x.t[0]))
    const t =
      t_set.has('mutez') ? 'mutez' :
      a.t[0] === 'timestamp' ? (b.t[0] === 'timestamp' ? 'int' : 'timestamp') : 'int'

    stack.insert(new StackItem([t], instr.annots, instr.prim, null, [a, b]))
  },
  XOR(stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    stack.insert(new StackItem(get_t(a.t[0]), instr.annots, instr.prim, null, [a, b]))
  },
  AND(stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    stack.insert(new StackItem(get_t(b.t[0]), instr.annots, instr.prim, null, [a, b]))
  },
  OR(stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    stack.insert(new StackItem(get_t(a.t[0]), instr.annots, instr.prim, null, [a, b]))
  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
  XXX(stack : Stack, instr : Object) {

  },
}