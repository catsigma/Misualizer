// @flow

import { Stack, StackItem } from './stack'

const get_t = t => t instanceof Array ? t : [t]

export const instr_mapping = {
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

    stack.insert(new StackItem(get_t(cond.t[1]), [], 'LEFT', null, [cond]))
    stack2.insert(new StackItem(get_t(cond.t[2]), [], 'RIGHT', null, [cond]))

    return [stack, stack2]
  }
}