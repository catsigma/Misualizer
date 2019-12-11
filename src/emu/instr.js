// @flow

import { Contract } from './contract'
import { Element } from './elem'
import { Stack } from './contract'
import { readType, createElementByType } from './micheline'

const json_clone = x => x === undefined ? x : JSON.parse(JSON.stringify(x))

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
    stack.insert(contract.newElement([a.t[0]], instr.annots, instr.prim, null, [a, b]))
    return stack
  },
  AND(contract : Contract, stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    stack.insert(contract.newElement([b.t[0]], instr.annots, instr.prim, null, [a, b]))
    return stack
  },
  OR(contract : Contract, stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    stack.insert(contract.newElement([a.t[0]], instr.annots, instr.prim, null, [a, b]))
    return stack
  },
  CONS(contract : Contract, stack : Stack, instr : Object) {
    const [item, lst] = stack.drop(2)
    stack.insert(contract.newElement(json_clone(lst.t), instr.annots, instr.prim, null, [item, lst]))
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
    stack1.insert(contract.newElement([lst.t[1]], [], 'HEAD', null, [lst]))
    stack1 = this.walkCode(instr.args[0], stack1)
    stack2 = this.walkCode(instr.args[1], stack2)

    stack.stack = stack1.combine(stack2)
    return stack
  },
  IF_LEFT(contract : Contract, stack : Stack, instr : Object) {
    const [condition] = stack.drop(1)

    if (condition.state === 'default') {
      const clone1 = stack.clone()
      const clone2 = stack.clone()
      clone1.pushCond(condition, 'default2left')
      clone2.pushCond(condition, 'default2right')

      clone1.insert(condition.children[0])
      clone2.insert(condition.children[1])
      const stacks1 = contract.walkCode(instr.args[0], [clone1])
      const stacks2 = contract.walkCode(instr.args[1], [clone2])
      return stacks1.concat(stacks2)

    } else if (condition.state === 'left') {
      stack.pushCond(condition, 'left')
      stack.insert(condition.children[0])
      return contract.walkCode(instr.args[0], [stack])

    } else if (condition.state === 'right') {
      stack.pushCond(condition, 'right')
      stack.insert(condition.children[1])
      return contract.walkCode(instr.args[1], [stack])

    } else {
      debugger
      throw `Invalid condition.state in IF_LEFT: ${condition.state || ''}`
    }
  },
  IF_NONE(contract : Contract, stack : Stack, instr : Object) {
    const [condition] = stack.drop(1)

    const clone1 = stack.clone()
    const clone2 = stack.clone()

    const stack1 = contract.walkCode(instr.args[0], clone1)
    const stack2 = contract.walkCode(instr.args[1], clone2)

    const new_stack = stack.clone()
    new_stack.stack =  stack1.equal(stack2).map(x)
   .forEach(result => {

    })
    
    if (condition.children.length) {
      stack.pushCond(condition, 'some')
      stack.insert(condition.children[0])
      return contract.walkCode(instr.args[1], [stack])

    } else if (condition.state === 'none') {
      stack.pushCond(condition, 'none')
      return contract.walkCode(instr.args[0], [stack])

    } else if (condition.state === 'default') {
      const clone1 = stack.clone()
      const clone2 = stack.clone()
      clone1.pushCond(condition, 'default2none')
      clone2.pushCond(condition, 'default2some')

      const mocked_elem = contract.mockElements(contract.fallbackType(condition.t[1]), 'generate')
      clone2.insert(mocked_elem)
      
      return stacks1.concat(stacks2)
      
    } else  {
      debugger
      throw `Invalid condition.state in IF_NONE: ${condition.state || ''}`
    }
  },
  IF(contract : Contract, stack : Stack, instr : Object) {
    const [condition] = stack.drop(1)
    
    if (condition.is_concrate) {
      if (condition.value === 'True') {
        stack.pushCond(condition, 'true')
        return contract.walkCode(instr.args[0], [stack])
      } else if (condition.value === 'False') {
        stack.pushCond(condition, 'false')
        return contract.walkCode(instr.args[1], [stack])
      } else {
        throw `Invalid condition in IF: ${condition.value}`
      }
    } else {
      const clone1 = stack.clone()
      const clone2 = stack.clone()
      clone1.pushCond(condition, 'default2true')
      clone2.pushCond(condition, 'default2false')

      const stacks1 = contract.walkCode(instr.args[0], [clone1])
      const stacks2 = contract.walkCode(instr.args[1], [clone2])
      return stacks1.concat(stacks2)
    }
  },
  LOOP_LEFT(stack : Stack, instr : Object, call_stack_level : number = 0) {
    const [condition] = stack.drop(1)

    if (call_stack_level === 8)
      return stack

    if (condition.state === 'left') {
      stack.pushCond(condition, 'left')
      stack.insert(condition.children[0])
      const stacks = contract.walkCode(instr.args[0], [stack])
      return stacks.reduce((acc, stack) => acc.concat(instrs.LOOP_LEFT.call(this, stack, instr, call_stack_level + 1)), [])

    } else if (condition.state === 'right') {
      stack.pushCond(condition, 'right')
      stack.insert(condition.children[1])
      return stack

    } else {
      const clone1 = stack.clone()
      const clone2 = stack.clone()
      clone1.pushCond(condition, 'default2left')
      clone2.pushCond(condition, 'default2right')

      clone1.pushCond(condition, 'left')
      const mocked_elem = contract.mockElements(contract.fallbackType(condition.t[1]), 'generate')
      mocked_elem.continuation = new Continuation(instr.prim, [mocked_elem.clone(), condition])
      clone1.insert(mocked_elem)

      clone2.pushCond(condition, 'right')

      const stacks1 = contract.walkCode(instr.args[0], [clone1])
      stacks1.forEach(stack => stack.replace(x => {
        if (!x.children[1])
          debugger

        return x.children[1]
      }))
      return stacks1.concat(clone2)
    }

  },
  LOOP(stack : Stack, instr : Object, call_stack_level : number = 0) {
    const [condition] = stack.drop(1)

    if (call_stack_level === 8)
      return stack

    if (condition.is_concrate) {
      if (condition.value === 'True') {
        stack.pushCond(condition, 'true')
        const stacks = contract.walkCode(instr.args[0], [stack])
        return stacks.reduce((acc, stack) => acc.concat(instrs.LOOP.call(this, stack, instr, call_stack_level + 1)), [])

      } else if (condition.value === 'False') {
        stack.pushCond(condition, 'false')
        return stack

      } else {
        throw `Invalid condition in LOOP: ${condition.value}`
      }
    } else {
      const clone1 = stack.clone()
      const clone2 = stack.clone()
      clone1.pushCond(condition, 'default2true')
      clone2.pushCond(condition, 'default2false')

      const stacks1 = contract.walkCode(instr.args[0], [clone1])
      stacks1.forEach(stack => {
        if (!stack.is_failed())
          stack.drop(1)
      })
      return stacks1.concat(clone2)
    }
  },
  SOME(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement({
      t: ['option', x.t],
      children: [x],
      annots: instr.annots,
      state: 'some'
    }, 'generate'))
    return stack
  },
  NONE(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement({
      t: ['option', contract.readType(instr.args[0])],
      children: [],
      annots: instr.annots,
      value: 'NONE',
      state: 'none'
    }))
    return stack
  },
  ITER(contract : Contract, stack : Stack, instr : Object) {
    const [item] = stack.drop(1)
    let stacks = [stack]
    if (item.children.length) {
      item.children.forEach(child => {
        stacks.forEach(stack => stack.insert(child))
        stacks = contract.walkCode(instr.args[0], stacks)
      })
    } else {
      item.instr = instr
      item.continuation = new Continuation(instr.prim, [item.clone()])
    }
    return stacks
  },
  MAP(contract : Contract, stack : Stack, instr : Object) {
    const [item] = stack.drop(1)
    const prev_len = stack.length()
    const prev_dip_top = stack.dip_top

    let stacks = [stack]
    if (item.children.length) {
      item.children.forEach(child => {
        stacks.forEach(stack => stack.insert(child))
        stacks = contract.walkCode(instr.args[0], stacks)
        stacks.forEach(stack => stack.dip_top += 1)
      })
      stacks.forEach(stack => {
        const cloned_item = item.clone()
        stack.dip_top = prev_dip_top
        cloned_item.children = stack.drop(stack.length() - prev_len)
        stack.insert(cloned_item)
      })
    } else {
      item.continuation = new Continuation(instr.prim, [item.clone()])
      stack.insert(item)
    }
    return stacks
  },
  FAILWITH(contract : Contract, stack : Stack, instr : Object) {
    stack.stack.splice(0, 0, contract.newElement({
      t: ['fail'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, stack.drop(1))
    }))
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
    const stacks = contract.walkCode(instr.args[0], [stack])
    stacks.forEach(stack => stack.dip_top = prev_dip_top)
    return stacks
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
    stack.insert(contract.newElement({
      t: ['timestamp'],
      annots: instr.annots,
      value: 'NOW'
    }))
    return stack
  },
  COMPARE(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement({
      t: ['int'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, stack.drop(2))
    }))
    return stack
  },
  base_compare(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement({
      t: ['bool'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, stack.drop(1))
    }))
    return stack
  },
  GT(contract : Contract, stack : Stack, instr : Object) {
    return instrs.base_compare.call(this, stack, instr)
  },
  EQ(contract : Contract, stack : Stack, instr : Object) {
    return instrs.base_compare.call(this, stack, instr)
  },
  GE(contract : Contract, stack : Stack, instr : Object) {
    return instrs.base_compare.call(this, stack, instr)
  },
  LE(contract : Contract, stack : Stack, instr : Object) {
    return instrs.base_compare.call(this, stack, instr)
  },
  LT(contract : Contract, stack : Stack, instr : Object) {
    return instrs.base_compare.call(this, stack, instr)
  },
  NEQ(contract : Contract, stack : Stack, instr : Object) {
    return instrs.base_compare.call(this, stack, instr)
  },
  AMOUNT(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement({
      t: ['mutez'],
      annots: instr.annots,
      value: 'AMOUNT'
    }))
    return stack
  },
  BALANCE(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement({
      t: ['mutez'],
      annots: instr.annots,
      value: 'BALANCE'
    }))
    return stack
  },
  SELF(contract : Contract, stack : Stack, instr : Object) {
    const parameter_t = contract.stack.top().t[1]
    stack.insert(contract.newElement({
      t: ['contract', parameter_t],
      annots: instr.annots,
      value: 'SELF'
    }))
    return stack
  },
  SWAP(contract : Contract, stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    stack.insert(a)
    stack.insert(b)
    return stack
  },
  CHAIN_ID(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement({
      t: ['chain_id'],
      annots: instr.annots,
      value: 'CHAIN_ID'
    }))
    return stack
  },
  UNIT(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement({
      t: ['unit'],
      annots: instr.annots,
      value: 'UNIT'
    }))
    return stack
  },
  IMPLICIT_ACCOUNT(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement({
      t: ['contract', 'unit'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, stack.drop(1))
    }))
    return stack
  },
  TRANSFER_TOKENS(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement({
      t: ['operation'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, stack.drop(3))
    }))
    return stack
  },
  PACK(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement({
      t: ['bytes'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  UNPACK(contract : Contract, stack : Stack, instr : Object) {
    stack.replace(x => contract.newElement({
      t: ['option', contract.readType(instr.args[0])],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  CHECK_SIGNATURE(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement({
      t: ['bool'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, stack.drop(3))
    }))
    return stack
  },
  APPLY(contract : Contract, stack : Stack, instr : Object) {
    const [param, lambda] = stack.drop(2)

    if (lambda.t[1] instanceof Array)
      lambda.t[1] = lambda.t[1][2]
    else
      throw `Invalid lambda in APPLY`

    if (lambda.instr) {
      const code = lambda.instr.args[2] || []
      code.unshift({prim: 'PAIR'})
      code.unshift({
        prim: 'PUSH',
        args: [
          contract.fallbackType(param.t),
          param
        ]
      })
    }

    stack.insert(lambda)
    return stack
  },
  EXEC(contract : Contract, stack : Stack, instr : Object) {
    const [arg, lambda] = stack.drop(2)
    const lambda_instr = lambda.instr || {args: []}

    if (lambda_instr.args.length > 2) {
      stack.insert(arg)
      return contract.walkCode(lambda_instr.args[2], [stack])
    }

    stack.insert(contract.newElement({
      t: lambda.t[2],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [arg, lambda])
    }))
    return stack
  },
  LAMBDA(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement({
      t: ['lambda', contract.readType(instr.args[0]), contract.readType(instr.args[1])],
      annots: instr.annots,
      instr
    }))
    return stack
  },
  CONCAT(contract : Contract, stack : Stack, instr : Object) {
    const [item] = stack.drop(1)
    if (item.t[0] === 'list') {
      stack.insert(contract.newElement({
        t: [item.t[1]],
        annots: instr.annots,
        continuation: new Continuation(instr.prim, [item])
      }))
      return stack
    } else {
      const [item2] = stack.drop(1)
      stack.insert(contract.newElement({
        t: [item.t[0]],
        annots: instr.annots,
        continuation: new Continuation(instr.prim, [item, item2])
      }))
      return stack
    }
  },
  CONTRACT(contract : Contract, stack : Stack, instr : Object) {
    const [address] = stack.drop(1)
    stack.insert(contract.newElement({
      t: ['option', ['contract', contract.readType(instr.args[0])]],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [address]),
      state: 'default'
    }))
    return stack
  },
  STEPS_TO_QUOTA(contract : Contract, stack : Stack, instr : Object) {
    stack.insert(contract.newElement({
      t: ['nat'],
      value: 'STEPS_TO_QUOTA'
    }))
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