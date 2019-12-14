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
    stack.replace(item => item.subs[0])
    return stack
  },
  CDR(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(item => item.subs[1])
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
      json_clone(['pair', a.t, b.t]), instr.annots, instr.prim, null, [a, b]))

    return stack
  },
  IF_CONS(contract : Contract, stack : Stack, instr : Object) {
    const [lst] = stack.drop(1)

    let stack1 = stack.clone()
    let stack2 = stack.clone()

    stack1.insert(lst)
    stack1.insert(contract.newElement(get_t_lst(lst.t[1]), [], 'ITEM.0', null, [lst]))

    stack1 = contract.walkCode(instr.args[0], stack1)
    stack2 = contract.walkCode(instr.args[1], stack2)

    stack.stack = stack1.combine(stack2, contract, instr.prim, instr.annots)
    return stack
  },
  IF_LEFT(contract : Contract, stack : Stack, instr : Object) {
    const [or_item] = stack.drop(1)

    let stack1 = stack.clone()
    let stack2 = stack.clone()

    stack1.insert(contract.newElement(get_t_lst(or_item.t[1]), instr.annots, 'OR.LEFT', null, [or_item]))
    stack2.insert(contract.newElement(get_t_lst(or_item.t[2]), instr.annots, 'OR.RIGHT', null, [or_item]))

    stack1 = contract.walkCode(instr.args[0], stack1)
    stack2 = contract.walkCode(instr.args[1], stack2)

    stack.stack = stack1.combine(stack2, contract, instr.prim, instr.annots)
    return stack
  },
  IF_NONE(contract : Contract, stack : Stack, instr : Object) {
    const [option_item] = stack.drop(1)

    let stack1 = stack.clone()
    let stack2 = stack.clone()

    stack2.insert(contract.newElement(get_t_lst(option_item.t[1]), instr.annots, 'OPTION.0', null, [option_item]))

    stack1 = contract.walkCode(instr.args[0], stack1)
    stack2 = contract.walkCode(instr.args[1], stack2)

    stack.stack = stack1.combine(stack2, contract, instr.prim, instr.annots)
    return stack
  },
  IF(contract : Contract, stack : Stack, instr : Object) {
    const [condition] = stack.drop(1)
    
    let stack1 = stack.clone()
    let stack2 = stack.clone()

    stack1 = contract.walkCode(instr.args[0], stack1)
    stack2 = contract.walkCode(instr.args[1], stack2)

    stack.stack = stack1.combine(stack2, contract, instr.prim, instr.annots)
    return stack
  },
  LOOP_LEFT(contract : Contract, stack : Stack, instr : Object) {
    const [or_item] = stack.drop(1)

    let stack1 = stack.clone()
    let stack2 = stack.clone()

    stack1.insert(contract.newElement(get_t_lst(or_item.t[2]), instr.annots, 'OR.LEFT.RIGHT', null, [or_item]))
    stack2.insert(contract.newElement(get_t_lst(or_item.t[2]), instr.annots, 'OR.RIGHT', null, [or_item]))

    stack1 = contract.walkCode(instr.args[0], stack1)
    stack2 = contract.walkCode(instr.args[1], stack2)

    stack.stack = stack1.combine(stack2, contract, instr.prim, instr.annots)
    return stack
  },
  LOOP(contract : Contract, stack : Stack, instr : Object) {
    const [condition] = stack.drop(1)

    let stack1 = stack.clone()
    let stack2 = stack.clone()

    stack1 = contract.walkCode(instr.args[0], stack1)
    stack2 = contract.walkCode(instr.args[1], stack2)

    stack.stack = stack1.combine(stack2, contract, instr.prim, instr.annots)
    return stack
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
    stack.replace(x => contract.newElement(
      ['option', json_clone(x.t)],
      instr.annots,
      instr.prim,
      null,
      [x]
    ))

    return stack
  },
  ITER(contract : Contract, stack : Stack, instr : Object) {
    const [lst_item] = stack.drop(1)

    let stack1 = stack.clone()
    let stack2 = stack.clone()
    
    stack1.insert(contract.newElement(get_t_lst(lst_item.t[1]), instr.annots, 'ITEM.0', null, [lst_item]))
    stack1 = contract.walkCode(instr.args[0], stack1)

    stack.stack = stack1.combine(stack2, contract, instr.prim, instr.annots)
    return stack
  },
  MAP(contract : Contract, stack : Stack, instr : Object) {
    const [iter_item] = stack.drop(1)

    stack.insert(contract.newElement(get_t_lst(iter_item.t), instr.annots, 'ITEMS', null, [iter_item]))
    return stack
  },
  FAILWITH(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(['fail'], instr.annots, '', null, stack.drop(1)))
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
    stack.insert(contract.newElement(['timestamp'], instr.annots, '', 'NOW', []))
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
    stack.insert(contract.newElement(['mutez'], instr.annots, '', 'AMOUNT', []))
    return stack
  },
  BALANCE(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(['mutez'], instr.annots, '', 'BALANCE', []))
    return stack
  },
  SELF(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement(
      ['contract', readType(instr.args[0])],
      instr.annots,
      '',
      'SELF',
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
    stack.insert(contract.newElement(['chain_id'], instr.annots, '', 'CHAIN_ID', []))
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

    if (lambda.value.length) {
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
    
    const addr_el = contract.newElement({
      t: ['address']
    }, 'generate')
    addr_el.continuation = new Continuation(instr.prim + '_ADDR', [addr_el.clone()].concat(args))
    stack.insert(addr_el)

    stack.insert(contract.newElement({
      t: ['operation'],
      continuation: new Continuation(instr.prim, args)
    }))

    return stack
  },
  CREATE_CONTRACT(contract : Contract, stack : Stack, instr : Object) {
    const args = stack.top().t[0] === 'key_hash' ? stack.drop(5) : stack.drop(3)
    const prim = args.length === 5 ? 'OLD_CREATE_CONTRACT' : 'CREATE_CONTRACT'

    const addr_el = contract.newElement({
      t: ['address']
    }, 'generate')
    addr_el.continuation = new Continuation(prim + '_ADDR', [addr_el.clone()].concat(args))
    stack.insert(addr_el)

    stack.insert(contract.newElement({
      t: ['operation'],
      continuation: new Continuation(prim, args)
    }))

    return stack
  },
  MEM(contract : Contract, stack : Stack, instr : Object) {
    const [item, group] = stack.drop(2)

    const items = new Set(group.children.map(x => x.value))

    if (items.has(item)) {
      stack.insert(contract.newElement({
        t: ['bool'],
        annots: instr.annots,
        value: 'True'
      }))
    } else {
      stack.insert(contract.newElement({
        t: ['bool'],
        annots: instr.annots,
        continuation: new Continuation(instr.prim, [item, group])
      }))
    }

    return stack
  },
  GET(contract : Contract, stack : Stack, instr : Object) {
    const [key, group] = stack.drop(2)

    const keys = group.children.map(x => x.children[0])
    const index = keys.indexOf(key)

    if (index > -1) {
      stack.insert(group.children[index].children[1])
    } else {
      stack.insert(contract.newElement({
        t: ['option', group.t[2]],
        annots: instr.annots,
        continuation: new Continuation(instr.prim, [key, group]),
        state: 'default'
      }))
    }
    return stack
  },
  UPDATE(contract : Contract, stack : Stack, instr : Object) {
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
        group.children.push(contract.newElement({
          t: ['elt'],
          children: [key, value]
        }))
      }
      stack.insert(group)
      return stack

    }
  },
  LEFT(contract : Contract, stack : Stack, instr : Object) {
    const [item] = stack.drop(1)
    stack.insert(contract.newElement({
      t: ['or', item.t, contract.readType(instr.args[0])],
      annots: instr.annots,
      children: [item],
      state: 'left'
    }))
    return stack
  },
  RIGHT(contract : Contract, stack : Stack, instr : Object) {
    const [item] = stack.drop(1)
    stack.insert(contract.newElement({
      t: ['or', contract.readType(instr.args[0]), item.t],
      annots: instr.annots,
      children: [,item],
      state: 'right'
    }))
    return stack
  },
  EMPTY_SET(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement({
      t: ['set', contract.readType(instr.args[0])],
      annots: instr.annots
    }))
    return stack
  },
  EMPTY_BIG_MAP(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement({
      t: ['big_map', contract.readType(instr.args[0]), contract.readType(instr.args[1])],
      annots: instr.annots
    }))
    return stack
  },
  EMPTY_MAP(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement({
      t: ['map', contract.readType(instr.args[0]), contract.readType(instr.args[1])],
      annots: instr.annots
    }))
    return stack
  },
  SHA256(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement({
      t: ['bytes'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  SHA512(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement({
      t: ['bytes'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  BLAKE2B(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement({
      t: ['bytes'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  HASH_KEY(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement({
      t: ['key_hash'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  ADDRESS(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement({
      t: ['address'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  SOURCE(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement({
      t: ['address'],
      annots: instr.annots,
      value: 'SOURCE'
    }))
    return stack
  },
  SENDER(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement({
      t: ['address'],
      annots: instr.annots,
      value: 'SENDER'
    }))
    return stack
  },
  ISNAT(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement({
      t: ['option', 'bool'],
      state: 'default',
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  SET_DELEGATE(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement({
      t: ['operation'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  SIZE(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement({
      t: ['nat'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  NOT(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement({
      t: ['int'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  SLICE(contract : Contract, stack : Stack, instr : Object) {
    const [offset, length, str] = stack.drop(3)
    stack.insert(contract.newElement({
      t: ['option', 'string'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [offset, length, str])
    }))
    return stack
  },
  RENAME(contract : Contract, stack : Stack, instr : Object) {
    stack.top().annots = instr.annots
    return stack
  },
  CAST(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => {
      x.t = [contract.readType(instr.args[0])]
      return x
    })
    return stack
  }
}