// @flow

import type { Contract } from './contract'
import { Element, Continuation } from './elem'
import { Stack } from './contract'

export const instrs = {
  STOP(stack : Stack, instr : Object) {
    debugger
    return stack
  },
  CAR(stack : Stack, instr : Object) {
    stack.replace(x => x.children[0])
    return stack
  },
  CDR(stack : Stack, instr : Object) {
    stack.replace(x => x.children[1])
    return stack
  },
  DROP(stack : Stack, instr : Object) {
    const count = instr.args && instr.args[0].int ? parseInt(instr.args[0].int) : 1
    stack.drop(count)
    return stack
  },
  PUSH(stack : Stack, instr : Object) {
    stack.insert(instr.args[1] instanceof Element ?
      instr.args[1] :
      this.createElements(instr.args[0], instr.args[1]))

    return stack
  },
  INT(stack : Stack, instr : Object) {
    stack.replace(x => new Element({
      t: ['int'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  ABS(stack : Stack, instr : Object) {
    stack.replace(x => new Element({
      t: ['nat'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  EDIV(stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    const t = a.t[0] === 'nat' && b.t[0] === 'nat' ? 'nat' : 'int'

    if (b.value === '0') {
      stack.insert(new Element({
        t: ['option', ['pair', t, 'nat']],
        annots: instr.annots,
        value: 'NONE',
        state: 'none'
      }))
      return stack
    } else {
      const stack1 = stack.clone()
      const stack2 = stack.clone()

      stack1.insert(new Element({
        t: ['option', ['pair', t, 'nat']],
        annots: instr.annots,
        value: 'NONE',
        state: 'none'
      }))

      stack2.insert(new Element({
        t: ['option', ['pair', t, 'nat']],
        annots: instr.annots,
        children: [new Element({
          t: ['pair', t, 'nat'],
          children: [
            new Element({
              t: [t],
              continuation: new Continuation('DIV', [a, b])
            }),
            new Element({
              t: ['nat'],
              continuation: new Continuation('MOD', [a, b])
            })
          ]
        })]
      }))

      return [stack1, stack2]
    }

  },
  MUL(stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)
    const kind_set = new Set([a, b].map(x => x.t[0]))
    const kind = kind_set.has('int') ? 'int' : 'nat'

    stack.insert(new Element({
      t: [kind],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [a, b])
    }))
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
  SUB(stack : Stack, instr : Object) {
    const [a, b] = stack.drop(2)

    stack.insert(new Element({
      t: ['int'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [a, b])
    }))
    return stack
  },
  XOR(stack : Stack, instr : Object) {
    stack.insert(new Element({
      t: ['bool'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, stack.drop(2))
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
  OR(stack : Stack, instr : Object) {
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
  IF_CONS(stack : Stack, instr : Object) {
    const [lst] = stack.drop(1)

    if (lst.children.length) {
      stack.pushCond(lst, 'non_empty')
      stack.insert(lst)
      stack.insert(lst.children.shift())
      if (!lst.children.length)
        lst.state = 'empty'

      return this.walkCode(instr.args[0], [stack])
       
    } else if (lst.state === 'default') {
      const clone1 = stack.clone()
      const clone2 = stack.clone()
      clone1.pushCond(lst, 'default2non_empty')
      clone2.pushCond(lst, 'default2empty')

      clone1.insert(lst)
      const mocked_elem = this.mockElements(this.fallbackType(lst.t[1]), 'generate')
      mocked_elem.continuation = new Continuation(instr.prim, [mocked_elem.clone(), lst])
      clone1.insert(mocked_elem)

      const stacks1 = this.walkCode(instr.args[0], [clone1])
      const stacks2 = this.walkCode(instr.args[1], [clone2])
      return stacks1.concat(stacks2)

    } else if (lst.state === 'empty') {
      stack.pushCond(lst, 'empty')
      return this.walkCode(instr.args[1], [stack])
       
    } else {
      debugger
      throw `Invalid condition.state in IF_CONS: ${lst.state || ''}`
    }
  },
  IF_LEFT(stack : Stack, instr : Object) {
    const [condition] = stack.drop(1)

    if (condition.state === 'default') {
      const clone1 = stack.clone()
      const clone2 = stack.clone()
      clone1.pushCond(condition, 'default2left')
      clone2.pushCond(condition, 'default2right')

      clone1.insert(condition.children[0])
      clone2.insert(condition.children[1])
      const stacks1 = this.walkCode(instr.args[0], [clone1])
      const stacks2 = this.walkCode(instr.args[1], [clone2])
      return stacks1.concat(stacks2)

    } else if (condition.state === 'left') {
      stack.pushCond(condition, 'left')
      stack.insert(condition.children[0])
      return this.walkCode(instr.args[0], [stack])

    } else if (condition.state === 'right') {
      stack.pushCond(condition, 'right')
      stack.insert(condition.children[1])
      return this.walkCode(instr.args[1], [stack])

    } else {
      debugger
      throw `Invalid condition.state in IF_LEFT: ${condition.state || ''}`
    }
  },
  IF_NONE(stack : Stack, instr : Object) {
    const [condition] = stack.drop(1)

    if (condition.children.length) {
      stack.pushCond(condition, 'some')
      stack.insert(condition.children[0])
      return this.walkCode(instr.args[1], [stack])

    } else if (condition.state === 'none') {
      stack.pushCond(condition, 'none')
      return this.walkCode(instr.args[0], [stack])

    } else if (condition.state === 'default') {
      const clone1 = stack.clone()
      const clone2 = stack.clone()
      clone1.pushCond(condition, 'default2none')
      clone2.pushCond(condition, 'default2some')

      const mocked_elem = this.mockElements(this.fallbackType(condition.t[1]), 'generate')
      clone2.insert(mocked_elem)
      
      const stacks1 = this.walkCode(instr.args[0], [clone1])
      const stacks2 = this.walkCode(instr.args[1], [clone2])
      return stacks1.concat(stacks2)
      
    } else  {
      debugger
      throw `Invalid condition.state in IF_NONE: ${condition.state || ''}`
    }
  },
  IF(stack : Stack, instr : Object) {
    const [condition] = stack.drop(1)
    
    if (condition.is_concrate) {
      if (condition.value === 'True') {
        stack.pushCond(condition, 'true')
        return this.walkCode(instr.args[0], [stack])
      } else if (condition.value === 'False') {
        stack.pushCond(condition, 'false')
        return this.walkCode(instr.args[1], [stack])
      } else {
        throw `Invalid condition in IF: ${condition.value}`
      }
    } else {
      const clone1 = stack.clone()
      const clone2 = stack.clone()
      clone1.pushCond(condition, 'default2true')
      clone2.pushCond(condition, 'default2false')

      const stacks1 = this.walkCode(instr.args[0], [clone1])
      const stacks2 = this.walkCode(instr.args[1], [clone2])
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
      const stacks = this.walkCode(instr.args[0], [stack])
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
      const mocked_elem = this.mockElements(this.fallbackType(condition.t[1]), 'generate')
      mocked_elem.continuation = new Continuation(instr.prim, [mocked_elem.clone(), condition])
      clone1.insert(mocked_elem)

      clone2.pushCond(condition, 'right')

      const stacks1 = this.walkCode(instr.args[0], [clone1])
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
        const stacks = this.walkCode(instr.args[0], [stack])
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

      const stacks1 = this.walkCode(instr.args[0], [clone1])
      stacks1.forEach(stack => {
        if (!stack.is_failed())
          stack.drop(1)
      })
      return stacks1.concat(clone2)
    }
  },
  SOME(stack : Stack, instr : Object) {
    stack.replace(x => new Element({
      t: ['option', x.t],
      children: [x],
      annots: instr.annots,
      state: 'some'
    }, 'generate'))
    return stack
  },
  NONE(stack : Stack, instr : Object) {
    stack.insert(new Element({
      t: ['option', this.readType(instr.args[0])],
      children: [],
      annots: instr.annots,
      value: 'NONE',
      state: 'none'
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
      item.continuation = new Continuation(instr.prim, [item.clone()])
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
      item.continuation = new Continuation(instr.prim, [item.clone()])
      stack.insert(item)
    }
    return stacks
  },
  FAILWITH(stack : Stack, instr : Object) {
    stack.stack.splice(0, 0, new Element({
      t: ['fail'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, stack.drop(1))
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
  DUG(stack : Stack, instr : Object) {
    const nth = parseInt(instr.args[0].int)
    const [item] = stack.drop(1)
    stack.insertAt(nth, item)
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
  UNPACK(stack : Stack, instr : Object) {
    stack.replace(x => new Element({
      t: ['option', this.readType(instr.args[0])],
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
  APPLY(stack : Stack, instr : Object) {
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
          this.fallbackType(param.t),
          param
        ]
      })
    }

    stack.insert(lambda)
    return stack
  },
  EXEC(stack : Stack, instr : Object) {
    const [arg, lambda] = stack.drop(2)
    const lambda_instr = lambda.instr || {args: []}

    if (lambda_instr.args.length > 2) {
      stack.insert(arg)
      return this.walkCode(lambda_instr.args[2], [stack])
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
      instr
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
      state: 'default'
    }))
    return stack
  },
  CREATE_CONTRACT(stack : Stack, instr : Object) {
    const args = stack.drop(3)

    const addr_el = new Element({
      t: ['address']
    }, 'generate')
    addr_el.continuation = new Continuation(instr.prim + '_ADDR', [addr_el.clone()].concat(args))
    stack.insert(addr_el)

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
  GET(stack : Stack, instr : Object) {
    const [key, group] = stack.drop(2)

    const keys = group.children.map(x => x.children[0])
    const index = keys.indexOf(key)

    if (index > -1) {
      stack.insert(group.children[index].children[1])
    } else {
      stack.insert(new Element({
        t: ['option', group.t[2]],
        annots: instr.annots,
        continuation: new Continuation(instr.prim, [key, group]),
        state: 'default'
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
  },
  LEFT(stack : Stack, instr : Object) {
    const [item] = stack.drop(1)
    stack.insert(new Element({
      t: ['or', item.t, this.readType(instr.args[0])],
      annots: instr.annots,
      children: [item],
      state: 'left'
    }))
    return stack
  },
  RIGHT(stack : Stack, instr : Object) {
    const [item] = stack.drop(1)
    stack.insert(new Element({
      t: ['or', this.readType(instr.args[0]), item.t],
      annots: instr.annots,
      children: [,item],
      state: 'right'
    }))
    return stack
  },
  EMPTY_SET(stack : Stack, instr : Object) {
    stack.insert(new Element({
      t: ['set', this.readType(instr.args[0])],
      annots: instr.annots
    }))
    return stack
  },
  EMPTY_BIG_MAP(stack : Stack, instr : Object) {
    stack.insert(new Element({
      t: ['big_map', this.readType(instr.args[0]), this.readType(instr.args[1])],
      annots: instr.annots
    }))
    return stack
  },
  EMPTY_MAP(stack : Stack, instr : Object) {
    stack.insert(new Element({
      t: ['map', this.readType(instr.args[0]), this.readType(instr.args[1])],
      annots: instr.annots
    }))
    return stack
  },
  SHA256(stack : Stack, instr : Object) {
    stack.replace(x => new Element({
      t: ['bytes'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  SHA512(stack : Stack, instr : Object) {
    stack.replace(x => new Element({
      t: ['bytes'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  BLAKE2B(stack : Stack, instr : Object) {
    stack.replace(x => new Element({
      t: ['bytes'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  HASH_KEY(stack : Stack, instr : Object) {
    stack.replace(x => new Element({
      t: ['key_hash'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  ADDRESS(stack : Stack, instr : Object) {
    stack.replace(x => new Element({
      t: ['address'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  SOURCE(stack : Stack, instr : Object) {
    stack.insert(new Element({
      t: ['address'],
      annots: instr.annots,
      value: 'SOURCE'
    }))
    return stack
  },
  SENDER(stack : Stack, instr : Object) {
    stack.insert(new Element({
      t: ['address'],
      annots: instr.annots,
      value: 'SENDER'
    }))
    return stack
  },
  ISNAT(stack : Stack, instr : Object) {
    stack.replace(x => new Element({
      t: ['option', 'bool'],
      state: 'default',
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  SET_DELEGATE(stack : Stack, instr : Object) {
    stack.replace(x => new Element({
      t: ['operation'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  SIZE(stack : Stack, instr : Object) {
    stack.replace(x => new Element({
      t: ['nat'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  NOT(stack : Stack, instr : Object) {
    stack.replace(x => new Element({
      t: ['int'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [x])
    }))
    return stack
  },
  SLICE(stack : Stack, instr : Object) {
    const [offset, length, str] = stack.drop(3)
    stack.insert(new Element({
      t: ['option', 'string'],
      annots: instr.annots,
      continuation: new Continuation(instr.prim, [offset, length, str])
    }))
    return stack
  },
  RENAME(stack : Stack, instr : Object) {
    stack.top().annots = instr.annots
    return stack
  }
}