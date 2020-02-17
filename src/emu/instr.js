// @flow

import { Contract } from './contract'
import { Element } from './elem'
import { Stack } from './contract'
import { readType, fallbackType, createElementByType, mockValueFromType } from './micheline'

const json_clone = x => x === undefined ? x : JSON.parse(JSON.stringify(x))
const get_t_lst = t => json_clone(t instanceof Array ? t : [t])

export const instrs = {
  STOP(contract : Contract, stack : Stack, instr : Object) {
    debugger
    return stack
  },
  CAR(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(item => {
      if (item.instr) {
        return contract.newElement(get_t_lst(item.t[1]), instr.annots, 'PAIR.0', null, [item])
      } else {
        return item.subs[0]
      }
    })
    return stack
  },
  CDR(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(item => {
      if (item.instr) {
        return contract.newElement(get_t_lst(item.t[2]), instr.annots, 'PAIR.1', null, [item])
      } else {
        return item.subs[1]
      }
    })
    return stack
  },
  DROP(contract : Contract, stack : Stack, instr : Object) {
    const count = instr.args && instr.args[0].int ? parseInt(instr.args[0].int) : 1
    stack.drop(count)
    return stack
  },
  PUSH(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(createElementByType(instr.args[0], instr.args[1], contract.elem_id))
    return stack
  },
  INT(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement(['int'], instr.annots, instr.prim, null, [x]))
    return stack
  },
  NEG(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement(['int'], instr.annots, instr.prim, null, [x]))
    return stack
  },
  ABS(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement(['nat'], instr.annots, instr.prim, null, [x]))
    return stack
  },
  LSL(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(['nat'], instr.annots, instr.prim, null, stack.drop(2)))
    return stack
  },
  LSR(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(['nat'], instr.annots, instr.prim, null, stack.drop(2)))
    return stack
  },
  EDIV(contract : Contract, stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    let t1, t2
    if (a.t[0] === 'mutez') {
      t1 = b.t[0] === 'nat' ? 'mutez' : 'nat'
      t2 = 'mutez'
    } else {
      t1 = a.t[0] === 'nat' && b.t[0] === 'nat' ? 'nat' : 'int'
      t2 = 'nat'
    }

    stack.insert(contract.newElement(
      ['option', ['pair', t1, t2]], instr.annots, instr.prim, null, [a, b]))
    return stack
  },
  MUL(contract : Contract, stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    const t_set = new Set([a, b].map(x => x.t[0]))
    const t = t_set.has('mutez') ? 'mutez' : t_set.has('int') ? 'int' : 'nat'

    stack.insert(contract.newElement([t], instr.annots, instr.prim, null, [a, b]))
    return stack
  },
  ADD(contract : Contract, stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    const t_set = new Set([a, b].map(x => x.t[0]))
    const t =
      t_set.has('timestamp') ? 'timestamp' : 
      t_set.has('mutez') ? 'mutez' :
      t_set.has('int') ? 'int' : 'nat'

    stack.insert(contract.newElement([t], instr.annots, instr.prim, null, [a, b]))
    return stack
  },
  SUB(contract : Contract, stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    const t_set = new Set([a, b].map(x => x.t[0]))
    const t =
      t_set.has('mutez') ? 'mutez' :
      a.t[0] === 'timestamp' ? (b.t[0] === 'timestamp' ? 'int' : 'timestamp') : 'int'

    stack.insert(contract.newElement([t], instr.annots, instr.prim, null, [a, b]))
    return stack
  },
  XOR(contract : Contract, stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    stack.insert(contract.newElement(get_t_lst(a.t[0]), instr.annots, instr.prim, null, [a, b]))
    return stack
  },
  AND(contract : Contract, stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    stack.insert(contract.newElement(get_t_lst(b.t[0]), instr.annots, instr.prim, null, [a, b]))
    return stack
  },
  OR(contract : Contract, stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    stack.insert(contract.newElement(get_t_lst(a.t[0]), instr.annots, instr.prim, null, [a, b]))
    return stack
  },
  CONS(contract : Contract, stack : Stack, instr : Object) {
    const [item, lst] = stack.drop(2)
    stack.insert(contract.newElement(get_t_lst(lst.t), instr.annots, instr.prim, null, [item, lst]))
    return stack
  },
  NIL(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(
      ['list', readType(instr.args[0])], instr.annots, instr.prim, null, []))

    return stack
  },
  PAIR(contract : Contract, stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    stack.insert(contract.newElement(
      json_clone(['pair', a.t, b.t]), instr.annots, '', null, [a, b]))

    return stack
  },
  IF_CONS(contract : Contract, stack : Stack, instr : Object) {
    const [lst] = stack.drop(1)

    let stack1 = stack.clone()
    let stack2 = stack.clone()
    stack1.pushCondition(lst, 'COND_ITEM', contract)
    stack2.pushCondition(lst, 'COND_EMPTY', contract)

    stack1.insert(lst)
    stack1.insert(contract.newElement(get_t_lst(lst.t[1]), [], 'ITEM.0', null, [lst]))

    stack1 = contract.walkCode(instr.args[0], stack1)
    stack2 = contract.walkCode(instr.args[1], stack2)

    let fails = 1
    if (stack1.is_failed()) fails += 2
    if (stack2.is_failed()) fails *= 2

    return ({
      '1': () => {
        stack.stack = stack1.combine(stack2, contract, instr.prim, lst, instr.annots)
        return stack
      },
      '2': () => {
        contract.fail_stacks.push(stack2)
        return stack1
      },
      '3': () => {
        contract.fail_stacks.push(stack1)
        return stack2
      },
      '6': () => {
        contract.fail_stacks.push(stack1)
        contract.fail_stacks.push(stack2)
        return stack1
      }
    })[fails]()
  },
  IF_LEFT(contract : Contract, stack : Stack, instr : Object) {
    const [or_item] = stack.drop(1)

    let stack1 = stack.clone()
    let stack2 = stack.clone()
    stack1.pushCondition(or_item, 'COND_LEFT', contract)
    stack2.pushCondition(or_item, 'COND_RIGHT', contract)

    stack1.insert(contract.newElement(get_t_lst(or_item.t[1]), instr.annots, 'OR.LEFT', null, [or_item]))
    stack2.insert(contract.newElement(get_t_lst(or_item.t[2]), instr.annots, 'OR.RIGHT', null, [or_item]))

    stack1 = contract.walkCode(instr.args[0], stack1)
    stack2 = contract.walkCode(instr.args[1], stack2)

    let fails = 1
    if (stack1.is_failed()) fails += 2
    if (stack2.is_failed()) fails *= 2

    return ({
      '1': () => {
        stack.stack = stack1.combine(stack2, contract, instr.prim, or_item, instr.annots)
        return stack
      },
      '2': () => {
        contract.fail_stacks.push(stack2)
        return stack1
      },
      '3': () => {
        contract.fail_stacks.push(stack1)
        return stack2
      },
      '6': () => {
        contract.fail_stacks.push(stack1)
        contract.fail_stacks.push(stack2)
        return stack1
      }
    })[fails]()
  },
  IF_NONE(contract : Contract, stack : Stack, instr : Object) {
    const [option_item] = stack.drop(1)

    let stack1 = stack.clone()
    let stack2 = stack.clone()
    stack1.pushCondition(option_item, 'COND_NONE', contract)
    stack2.pushCondition(option_item, 'COND_SOME', contract)

    stack2.insert(contract.newElement(get_t_lst(option_item.t[1]), instr.annots, 'OPTION.0', null, [option_item]))

    stack1 = contract.walkCode(instr.args[0], stack1)
    stack2 = contract.walkCode(instr.args[1], stack2)

    let fails = 1
    if (stack1.is_failed()) fails += 2
    if (stack2.is_failed()) fails *= 2

    return ({
      '1': () => {
        stack.stack = stack1.combine(stack2, contract, instr.prim, option_item, instr.annots)
        return stack
      },
      '2': () => {
        contract.fail_stacks.push(stack2)
        return stack1
      },
      '3': () => {
        contract.fail_stacks.push(stack1)
        return stack2
      },
      '6': () => {
        contract.fail_stacks.push(stack1)
        contract.fail_stacks.push(stack2)
        return stack1
      }
    })[fails]()
  },
  IF(contract : Contract, stack : Stack, instr : Object) {
    const [condition] = stack.drop(1)

    let stack1 = stack.clone()
    let stack2 = stack.clone()
    stack1.pushCondition(condition, 'COND_TRUE', contract)
    stack2.pushCondition(condition, 'COND_FALSE', contract)

    stack1 = contract.walkCode(instr.args[0], stack1)
    stack2 = contract.walkCode(instr.args[1], stack2)

    
    let fails = 1
    if (stack1.is_failed()) fails += 2
    if (stack2.is_failed()) fails *= 2

    return ({
      '1': () => {
        stack.stack = stack1.combine(stack2, contract, instr.prim, condition, instr.annots)
        return stack
      },
      '2': () => {
        contract.fail_stacks.push(stack2)
        return stack1
      },
      '3': () => {
        contract.fail_stacks.push(stack1)
        return stack2
      },
      '6': () => {
        contract.fail_stacks.push(stack1)
        contract.fail_stacks.push(stack2)
        return stack1
      }
    })[fails]()
  },
  LOOP_LEFT(contract : Contract, stack : Stack, instr : Object) {
    const [or_item] = stack.drop(1)
    
    let stack1 = stack.clone()
    let stack2 = stack.clone()
    stack1.pushCondition(or_item, 'COND_LEFT', contract)
    stack2.pushCondition(or_item, 'COND_RIGHT', contract)

    stack1.insert(contract.newElement(get_t_lst(or_item.t[2]), instr.annots, 'OR.LEFT.RIGHT', null, [or_item]))
    stack2.insert(contract.newElement(get_t_lst(or_item.t[2]), instr.annots, 'OR.RIGHT', null, [or_item]))

    stack1 = contract.walkCode(instr.args[0], stack1)
    

    let fails = 1
    if (stack1.is_failed()) fails += 2
    if (stack2.is_failed()) fails *= 2

    return ({
      '1': () => {
        stack.stack = stack1.combine(stack2, contract, instr.prim, or_item, instr.annots)
        return stack
      },
      '2': () => {
        contract.fail_stacks.push(stack2)
        return stack1
      },
      '3': () => {
        contract.fail_stacks.push(stack1)
        return stack2
      },
      '6': () => {
        contract.fail_stacks.push(stack1)
        contract.fail_stacks.push(stack2)
        return stack1
      }
    })[fails]()
  },
  LOOP(contract : Contract, stack : Stack, instr : Object) {
    const [condition] = stack.drop(1)

    let stack1 = stack.clone()
    let stack2 = stack.clone()
    stack1.pushCondition(condition, 'COND_TRUE', contract)
    stack2.pushCondition(condition, 'COND_FALSE', contract)

    stack1 = contract.walkCode(instr.args[0], stack1)
    
    stack1.drop(1)

    let fails = 1
    if (stack1.is_failed()) fails += 2
    if (stack2.is_failed()) fails *= 2

    return ({
      '1': () => {
        stack.stack = stack1.combine(stack2, contract, instr.prim, condition, instr.annots)
        return stack
      },
      '2': () => {
        contract.fail_stacks.push(stack2)
        return stack1
      },
      '3': () => {
        contract.fail_stacks.push(stack1)
        return stack2
      },
      '6': () => {
        contract.fail_stacks.push(stack1)
        contract.fail_stacks.push(stack2)
        return stack1
      }
    })[fails]()
  },
  SOME(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement(
      ['option', json_clone(x.t)],
      instr.annots,
      instr.prim,
      null,
      [x]
    ))

    return stack
  },
  NONE(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(
      ['option', readType(instr.args[0])], instr.annots, instr.prim, null, []
    ))
    return stack
  },
  ITER(contract : Contract, stack : Stack, instr : Object) {
    const [lst_item] = stack.drop(1)

    let stack1 = stack.clone()
    let stack2 = stack.clone()
    
    stack1.insert(contract.newElement(get_t_lst(lst_item.t[1]), instr.annots, 'ITEM.0', null, [lst_item]))
    stack1 = contract.walkCode(instr.args[0], stack1)

    
    let fails = 1
    if (stack1.is_failed()) fails += 2
    if (stack2.is_failed()) fails *= 2

    return ({
      '1': () => {
        stack.stack = stack1.combine(stack2, contract, instr.prim, lst_item, instr.annots)
        return stack
      },
      '2': () => {
        contract.fail_stacks.push(stack2)
        return stack1
      },
      '3': () => {
        contract.fail_stacks.push(stack1)
        return stack2
      },
      '6': () => {
        contract.fail_stacks.push(stack1)
        contract.fail_stacks.push(stack2)
        return stack1
      }
    })[fails]()
  },
  MAP(contract : Contract, stack : Stack, instr : Object) {
    const [iter_item] = stack.drop(1)

    stack.insert(contract.newElement(get_t_lst(iter_item.t), instr.annots, instr.prim, null, [iter_item]))
    return stack
  },
  FAILWITH(contract : Contract, stack : Stack, instr : Object) {
    const fail_elem = contract.newElement(['fail'], instr.annots, '', null, stack.drop(1).concat(stack.conditions))
    stack.empty()
    stack.insert(fail_elem)
    return stack
  },
  DUP(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(stack.top().clone())
    return stack
  },
  DIP(contract : Contract, stack : Stack, instr : Object) {
    const level = instr.args[0].int ? parseInt(instr.args.shift().int) : 1
    const prev_dip_top = stack.dip_top
    stack.dip_top += level
    stack = contract.walkCode(instr.args[0], stack)
    stack.dip_top = prev_dip_top
    return stack
  },
  DIG(contract : Contract, stack : Stack, instr : Object) {
    const nth = parseInt(instr.args[0].int)
    stack.insert(stack.dropAt(nth))
    return stack
  },
  DUG(contract : Contract, stack : Stack, instr : Object) {
    const nth = parseInt(instr.args[0].int)
    const [item] = stack.drop(1)
    stack.insertAt(nth, item)
    return stack
  },
  NOW(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(['timestamp'], instr.annots, '', contract.init_args.now, []))
    return stack
  },
  COMPARE(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(['int'], instr.annots, instr.prim, null, stack.drop(2)))
    return stack
  },
  GT(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement(['bool'], instr.annots, instr.prim, null, [x]))
    return stack
  },
  EQ(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement(['bool'], instr.annots, instr.prim, null, [x]))
    return stack
  },
  GE(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement(['bool'], instr.annots, instr.prim, null, [x]))
    return stack
  },
  LE(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement(['bool'], instr.annots, instr.prim, null, [x]))
    return stack
  },
  LT(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement(['bool'], instr.annots, instr.prim, null, [x]))
    return stack
  },
  NEQ(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement(['bool'], instr.annots, instr.prim, null, [x]))
    return stack
  },
  AMOUNT(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(['mutez'], instr.annots, '', contract.init_args.amount, []))
    return stack
  },
  BALANCE(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(['mutez'], instr.annots, '', contract.init_args.balance, []))
    return stack
  },
  SELF(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(
      ['contract', readType(contract.contract.parameter)],
      instr.annots,
      '',
      contract.init_args.self,
      []
    ))
    return stack
  },
  SWAP(contract : Contract, stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    stack.insert(a)
    stack.insert(b)
    return stack
  },
  CHAIN_ID(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(['chain_id'], instr.annots, '', contract.init_args.chain_id, []))
    return stack
  },
  UNIT(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(['unit'], instr.annots, '', 'Unit', []))
    return stack
  },
  IMPLICIT_ACCOUNT(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(['contract', 'unit'], instr.annots, instr.prim, null, stack.drop(1)))
    return stack
  },
  TRANSFER_TOKENS(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(['operation'], instr.annots, instr.prim, null, stack.drop(3)))
    return stack
  },
  PACK(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement(
      ['bytes'], instr.annots, instr.prim, null, [x]
    ))
    return stack
  },
  UNPACK(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement(
      ['option', readType(instr.args[0])], instr.annots, instr.prim, null, [x]
    ))
    return stack
  },
  CHECK_SIGNATURE(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(
      ['bool'], instr.annots, instr.prim, null, stack.drop(3)
    ))
    return stack
  },
  APPLY(contract : Contract, stack : Stack, instr : Object) {
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
    return stack
  },
  EXEC(contract : Contract, stack : Stack, instr : Object) {
    const [arg, lambda] = stack.drop(2)

    if (lambda.value && lambda.value.length) {
      stack.insert(arg)
      stack = contract.walkCode(lambda.value, stack)
    } else {
      stack.insert(contract.newElement(
        get_t_lst(lambda.t[2]), instr.annots, instr.prim, null, [arg, lambda]))
    }
    return stack
  },
  LAMBDA(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(
      ['lambda', readType(instr.args[0]), readType(instr.args[1])], instr.annots, '', instr.args[2], []
    ))
    return stack
  },
  CONCAT(contract : Contract, stack : Stack, instr : Object) {
    const [item] = stack.drop(1)
    if (item.t[0] === 'list') {
      stack.insert(contract.newElement(
        get_t_lst(item.t[1]), instr.annots, instr.prim, null, [item]
      ))
    } else {
      const [item2] = stack.drop(1)
      stack.insert(contract.newElement(
        get_t_lst(item.t[0]), instr.annots, instr.prim, null, [item, item2]
      ))
    }

    return stack
  },
  CONTRACT(contract : Contract, stack : Stack, instr : Object) {
    const [address] = stack.drop(1)

    stack.insert(contract.newElement(
      ['option', ['contract', readType(instr.args[0])]],
      instr.annots, '', null, [address]
    ))
    return stack
  },
  STEPS_TO_QUOTA(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(['nat'], instr.annots, '', 'STEPS_TO_QUOTA', []))
    return stack
  },
  CREATE_ACCOUNT(contract : Contract, stack : Stack, instr : Object) {
    const args = stack.drop(4)
    
    stack.insert(contract.newElement(
      ['address'], instr.annots, instr.prim + '_ADDR', null, args
    ))
    stack.insert(contract.newElement(
      ['operation'], instr.annots, instr.prim, null, args
    ))
    return stack
  },
  CREATE_CONTRACT(contract : Contract, stack : Stack, instr : Object) {
    const args = stack.top().t[0] === 'key_hash' ? stack.drop(5) : stack.drop(3)
    const prim = args.length === 5 ? 'LEGACY_CREATE_CONTRACT' : 'CREATE_CONTRACT'

    stack.insert(contract.newElement(
      ['address'], instr.annots, prim + '_ADDR', null, args
    ))
    stack.insert(contract.newElement(
      ['operation'], instr.annots, prim, null, args
    ))
    return stack
  },
  MEM(contract : Contract, stack : Stack, instr : Object) {
    const [item, group] = stack.drop(2)

    stack.insert(contract.newElement(
      ['bool'], instr.annots, instr.prim, null, [item, group]
    ))
    return stack
  },
  GET(contract : Contract, stack : Stack, instr : Object) {
    const [key, group] = stack.drop(2)

    stack.insert(contract.newElement(
      ['option', group.t[2]], instr.annots, instr.prim, null, [key, group]
    ))
    return stack
  },
  UPDATE(contract : Contract, stack : Stack, instr : Object) {
    const [key, value, group] = stack.drop(3)

    stack.insert(contract.newElement(
      get_t_lst(group.t), instr.annots, instr.prim, null, [key, value, group]
    ))
    return stack
  },
  LEFT(contract : Contract, stack : Stack, instr : Object) {
    const [item] = stack.drop(1)

    stack.insert(contract.newElement(
      ['or', item.t, readType(instr.args[0])], instr.annots, instr.prim, null, [item]
    ))
    return stack
  },
  RIGHT(contract : Contract, stack : Stack, instr : Object) {
    const [item] = stack.drop(1)
    
    stack.insert(contract.newElement(
      ['or', readType(instr.args[0]), item.t], instr.annots, instr.prim, null, [item]
    ))
    return stack
  },
  EMPTY_SET(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(
      ['set', readType(instr.args[0])], instr.annots, '', null, []
    ))
    return stack
  },
  EMPTY_BIG_MAP(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(
      ['big_map', readType(instr.args[0]), readType(instr.args[1])], instr.annots, '', null, []
    ))
    return stack
  },
  EMPTY_MAP(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(
      ['map', readType(instr.args[0]), readType(instr.args[1])], instr.annots, '', null, []
    ))
    return stack
  },
  SHA256(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement(
      ['bytes'], instr.annots, instr.prim, null, [x]
    ))
    return stack
  },
  SHA512(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement(
      ['bytes'], instr.annots, instr.prim, null, [x]
    ))
    return stack
  },
  BLAKE2B(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement(
      ['bytes'], instr.annots, instr.prim, null, [x]
    ))
    return stack
  },
  HASH_KEY(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement(
      ['key_hash'], instr.annots, instr.prim, null, [x]
    ))
    return stack
  },
  ADDRESS(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement(
      ['address'], instr.annots, instr.prim, null, [x]
    ))
    return stack
  },
  SOURCE(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(
      ['address'], instr.annots, '', contract.init_args.source, []
    ))
    return stack
  },
  SENDER(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(
      ['address'], instr.annots, '', contract.init_args.sender, []
    ))
    return stack
  },
  ISNAT(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement(
      ['option', 'bool'], instr.annots, instr.prim, null, [x]
    ))
    return stack
  },
  SET_DELEGATE(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement(
      ['operation'], instr.annots, instr.prim, null, [x]
    ))
    return stack
  },
  SIZE(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement(
      ['nat'], instr.annots, instr.prim, null, [x]
    ))
    return stack
  },
  NOT(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement(
      ['int'], instr.annots, instr.prim, null, [x]
    ))
    return stack
  },
  SLICE(contract : Contract, stack : Stack, instr : Object) {
    const [offset, length, item] = stack.drop(3)

    stack.insert(contract.newElement(
      ['option', item.t], instr.annots, instr.prim, null, [offset, length, item]
    ))
    return stack
  },
  RENAME(contract : Contract, stack : Stack, instr : Object) {
    stack.top().annots = instr.annots
    return stack
  },
  CAST(contract : Contract, stack : Stack, instr : Object) {
    stack.top().t = readType(instr.args[0])
    return stack
  }
}