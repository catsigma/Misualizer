// @flow

import { createStackItem, fallbackType, toVType } from './micheline'
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
  ITER(stack : Stack) {
    const [lst] = stack.drop(1)
    const stack2 = stack.clone()

    stack.insert(new StackItem(get_t(lst.t[1]), [], 'ITER.ITEM', null, [lst]))
    return [stack, stack2]
  },
  LOOP(stack : Stack) {
    const [cond] = stack.drop(1)
    const stack2 = stack.clone()

    return [stack, stack2]
  },
  LOOP_LEFT(stack : Stack) {
    const [cond] = stack.drop(1)
    const stack2 = stack.clone()

    stack.insert(new StackItem(get_t(cond.t[1]), [], 'LOOP_LEFT.LEFT', null, [cond]))
    stack2.insert(new StackItem(get_t(cond.t[2]), [], 'LOOP_LEFT.RIGHT', null, [cond]))

    return [stack, stack2]
  },
  IF_NONE(stack : Stack) {
    const [cond] = stack.drop(1)
    const stack2 = stack.clone()

    stack2.insert(new StackItem(get_t(cond.t[1]), [], 'IF_NONE.SOME', null, [cond]))

    return [stack, stack2]
  },
  IF_CONS(stack : Stack) {
    const [cond] = stack.drop(1)
    const stack2 = stack.clone()

    stack.insert(new StackItem(cond.t, [], 'IF_CONS.REST', null, [cond]))
    stack.insert(new StackItem(get_t(cond.t[1]), [], 'IF_CONS.HEAD', null, [cond]))

    return [stack, stack2]
  },
  IF_LEFT(stack : Stack) {
    const [cond] = stack.drop(1)
    const stack2 = stack.clone()

    stack.insert(new StackItem(get_t(cond.t[1]), [], 'IF_LEFT.LEFT', null, [cond]))
    stack2.insert(new StackItem(get_t(cond.t[2]), [], 'IF_LEFT.RIGHT', null, [cond]))

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

    // TODO: has concrete lambda value
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
  CONS(stack : Stack, instr : Object) {
    const [item, lst] = stack.drop(2)
    stack.insert(new StackItem(get_t(lst.t), instr.annots, instr.prim, null, [item, lst]))
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
  SOME(stack : Stack, instr : Object) {
    stack.replace(x => new StackItem(
      ['option', x.t],
      instr.annots,
      instr.prim,
      null,
      [x]
    ))
  },
  NONE(stack : Stack, instr : Object) {
    stack.insert(new StackItem(
      ['option', toVType(instr.args[0])], instr.annots, instr.prim, null, []
    ))
  },
  MAP(stack : Stack, instr : Object) {
    const [iter_item] = stack.drop(1)

    stack.insert(new StackItem(get_t(iter_item.t), instr.annots, instr.prim, null, [iter_item]))
  },
  DIP(stack : Stack, instr : Object) {
    const nth = parseInt(instr.args[0].int)
    stack.insert(stack.dropAt(nth))
  },
  DUG(stack : Stack, instr : Object) {
    const nth = parseInt(instr.args[0].int)
    const [item] = stack.drop(1)
    stack.insertAt(nth, item)
  },
  NOW(stack : Stack, instr : Object) {
    stack.insert(new StackItem(['timestamp'], instr.annots, '', stack.env.now, []))
  },
  COMPARE(stack : Stack, instr : Object) {
    stack.insert(new StackItem(['int'], instr.annots, instr.prim, null, stack.drop(2)))
  },
  EQ(stack : Stack, instr : Object) {
    stack.replace(x => new StackItem(['bool'], instr.annots, instr.prim, null, [x]))
  },
  NEQ(stack : Stack, instr : Object) {
    stack.replace(x => new StackItem(['bool'], instr.annots, instr.prim, null, [x]))
  },
  GT(stack : Stack, instr : Object) {
    stack.replace(x => new StackItem(['bool'], instr.annots, instr.prim, null, [x]))
  },
  GE(stack : Stack, instr : Object) {
    stack.replace(x => new StackItem(['bool'], instr.annots, instr.prim, null, [x]))
  },
  LE(stack : Stack, instr : Object) {
    stack.replace(x => new StackItem(['bool'], instr.annots, instr.prim, null, [x]))
  },
  LT(stack : Stack, instr : Object) {
    stack.replace(x => new StackItem(['bool'], instr.annots, instr.prim, null, [x]))
  },
  AMOUNT(stack : Stack, instr : Object) {
    stack.insert(new StackItem(['mutez'], instr.annots, '', stack.env.amount, []))
  },
  BALANCE(stack : Stack, instr : Object) {
    stack.insert(new StackItem(['mutez'], instr.annots, '', stack.env.balance, []))
  },
  SELF(stack : Stack, instr : Object, ) {
    stack.insert(new StackItem(
      ['contract', stack.attached.parameter_vtype],
      instr.annots,
      '',
      stack.env.self,
      []
    ))
  },
  CHAIN_ID(stack : Stack, instr : Object) {
    stack.insert(new StackItem(['chain_id'], instr.annots, '', stack.env.chain_id, []))
  },
  TRANSFER_TOKENS(stack : Stack, instr : Object) {
    stack.insert(new StackItem(['operation'], instr.annots, instr.prim, null, stack.drop(3)))
  },
  PACK(stack : Stack, instr : Object) {
    stack.replace(x => new StackItem(
      ['bytes'], instr.annots, instr.prim, null, [x]
    ))
  },
  UNPACK(stack : Stack, instr : Object) {
    stack.replace(x => new StackItem(
      ['option', toVType(instr.args[0])], instr.annots, instr.prim, null, [x]
    ))
  },
  CHECK_SIGNATURE(stack : Stack, instr : Object) {
    stack.insert(new StackItem(
      ['bool'], instr.annots, instr.prim, null, stack.drop(3)
    ))
  },
  APPLY(stack : Stack, instr : Object) {
    const [param, lambda] = stack.drop(2)

    if (!(lambda.value instanceof Array))
      throw `APPLY / invalid lambda value: ${lambda.value}`

    lambda.value.unshift({prim: 'PAIR'})
    lambda.value.unshift({
      prim: 'PUSH',
      args: [
        fallbackType(param.t),
        param
      ]
    })
    
    stack.insert(lambda)
  },
  LAMBDA(stack : Stack, instr : Object) {
    stack.insert(new StackItem(
      ['lambda', toVType(instr.args[0]), toVType(instr.args[1])], instr.annots, '', instr.args[2], []
    ))
  },
  CONCAT(stack : Stack, instr : Object) {
    const [item] = stack.drop(1)
    if (item.t[0] === 'list') {
      stack.insert(new StackItem(
        get_t(item.t[1]), instr.annots, instr.prim, null, [item]
      ))
    } else {
      const [item2] = stack.drop(1)
      stack.insert(new StackItem(
        get_t(item.t[0]), instr.annots, instr.prim, null, [item, item2]
      ))
    }
  },
  CONTRACT(stack : Stack, instr : Object) {
    const [address] = stack.drop(1)

    stack.insert(new StackItem(
      ['option', ['contract', toVType(instr.args[0])]],
      instr.annots, '', null, [address]
    ))
  },
  STEPS_TO_QUOTA(stack : Stack, instr : Object) {
    stack.insert(new StackItem(['nat'], instr.annots, '', 'STEPS_TO_QUOTA', []))
  },
  CREATE_ACCOUNT(stack : Stack, instr : Object) {
    const args = stack.drop(4)
    
    stack.insert(new StackItem(
      ['address'], instr.annots, instr.prim + '_ADDR', null, args
    ))
    stack.insert(new StackItem(
      ['operation'], instr.annots, instr.prim, null, args
    ))
  },
  CREATE_CONTRACT(stack : Stack, instr : Object) {
    const args = stack.top().t[0] === 'key_hash' ? stack.drop(5) : stack.drop(3)
    const prim = args.length === 5 ? 'LEGACY_CREATE_CONTRACT' : 'CREATE_CONTRACT'

    stack.insert(new StackItem(
      ['address'], instr.annots, prim + '_ADDR', null, args
    ))
    stack.insert(new StackItem(
      ['operation'], instr.annots, prim, null, args
    ))
  },
  MEM(stack : Stack, instr : Object) {
    const [item, group] = stack.drop(2)

    stack.insert(new StackItem(
      ['bool'], instr.annots, instr.prim, null, [item, group]
    ))
  },
  GET(stack : Stack, instr : Object) {
    const [key, group] = stack.drop(2)

    stack.insert(new StackItem(
      ['option', group.t[2]], instr.annots, instr.prim, null, [key, group]
    ))
  },
  UPDATE(stack : Stack, instr : Object) {
    const [key, value, group] = stack.drop(3)

    stack.insert(new StackItem(
      group.t, instr.annots, instr.prim, null, [key, value, group]
    ))
  },
  LEFT(stack : Stack, instr : Object) {
    const [item] = stack.drop(1)

    stack.insert(new StackItem(
      ['or', item.t, toVType(instr.args[0])], instr.annots, instr.prim, null, [item]
    ))
  },
  RIGHT(stack : Stack, instr : Object) {
    const [item] = stack.drop(1)
    
    stack.insert(new StackItem(
      ['or', toVType(instr.args[0]), item.t], instr.annots, instr.prim, null, [item]
    ))
  },
  EMPTY_SET(stack : Stack, instr : Object) {
    stack.insert(new StackItem(
      ['set', toVType(instr.args[0])], instr.annots, '', null, []
    ))
  },
  EMPTY_BIG_MAP(stack : Stack, instr : Object) {
    stack.insert(new StackItem(
      ['big_map', toVType(instr.args[0]), toVType(instr.args[1])], instr.annots, '', null, []
    ))
  },
  EMPTY_MAP(stack : Stack, instr : Object) {
    stack.insert(new StackItem(
      ['map', toVType(instr.args[0]), toVType(instr.args[1])], instr.annots, '', null, []
    ))
  },
  SHA256(stack : Stack, instr : Object) {
    stack.replace(x => new StackItem(
      ['bytes'], instr.annots, instr.prim, null, [x]
    ))
  },
  SHA512(stack : Stack, instr : Object) {
    stack.replace(x => new StackItem(
      ['bytes'], instr.annots, instr.prim, null, [x]
    ))
  },
  BLAKE2B(stack : Stack, instr : Object) {
    stack.replace(x => new StackItem(
      ['bytes'], instr.annots, instr.prim, null, [x]
    ))
  },
  HASH_KEY(stack : Stack, instr : Object) {
    stack.replace(x => new StackItem(
      ['key_hash'], instr.annots, instr.prim, null, [x]
    ))
  },
  ADDRESS(stack : Stack, instr : Object) {
    stack.replace(x => new StackItem(
      ['address'], instr.annots, instr.prim, null, [x]
    ))
  },
  SOURCE(stack : Stack, instr : Object) {
    stack.insert(new StackItem(
      ['address'], instr.annots, '', stack.env.source, []
    ))
  },
  SENDER(stack : Stack, instr : Object) {
    stack.insert(new StackItem(
      ['address'], instr.annots, '', stack.env.sender, []
    ))
  },
  ISNAT(stack : Stack, instr : Object) {
    stack.replace(x => new StackItem(
      ['option', 'bool'], instr.annots, instr.prim, null, [x]
    ))
  },
  SET_DELEGATE(stack : Stack, instr : Object) {
    stack.replace(x => new StackItem(
      ['operation'], instr.annots, instr.prim, null, [x]
    ))
  },
  SIZE(stack : Stack, instr : Object) {
    stack.replace(x => new StackItem(
      ['nat'], instr.annots, instr.prim, null, [x]
    ))
  },
  NOT(stack : Stack, instr : Object) {
    stack.replace(x => new StackItem(
      ['int'], instr.annots, instr.prim, null, [x]
    ))
  },
  SLICE(stack : Stack, instr : Object) {
    const [offset, length, item] = stack.drop(3)

    stack.insert(new StackItem(
      ['option', item.t], instr.annots, instr.prim, null, [offset, length, item]
    ))
  },
  CAST(stack : Stack, instr : Object) {
    stack.top().t = toVType(instr.args[0])
  }
}