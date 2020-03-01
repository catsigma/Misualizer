// @flow

import type { EType } from './elem'
import { Element } from './elem'
import { instrs } from './instr'
import { 
  readType, 
  fallbackType, 
  settingInstrID, 
  createElementByType, 
  mockValueFromType } from './micheline'

import type { rec_array } from '../renderer/repr'

export class Stack {
  stack : Array<Element>
  dip_top : number
  conditions : Array<Element>

  constructor(stack : Array<Element>) {
    this.stack = stack
    this.dip_top = 0
    this.conditions = []
  }

  length() {
    return this.stack.length
  }
  
  is_failed() {
    if (this.stack.indexOf(undefined) > -1) {
      debugger
      throw `is_failed / error stack item found: undefined`
    } else if (this.stack.some(x => x.t[0] === 'fail')) {
      return true
    }

    return false
  }

  equal(target : Stack) : Array<bool> {
    if (this.stack.length !== target.stack.length) {
      debugger
      throw `equal / the length of two stacks are not equal`
    }

    return this.stack.map((item, index) => {
      return item.id === target.stack[index].id
    })
  }

  combine(target : Stack, contract : Contract, instr : string, condition : Element, annots : Array<string> = []) : Array<Element> {
    return this.equal(target).map((result, index) => {
      const item = this.stack[index]
      if (result)
        return item
      else {
        return contract.newElement(item.t, annots, instr, null, [condition, item, target.stack[index]])
      }
    })
  }

  pushCondition(cond : Element, cond_instr : string, contract : Contract) {
    this.conditions.push(
      contract.newElement(['string'], [], cond_instr, null, [cond]))
  }

  at(index : number) : Element {
    return this.stack[index]
  }

  top() : Element {
    return this.stack[this.dip_top]
  }

  replace(fn : Element => Element) {
    this.stack[this.dip_top] = fn(this.stack[this.dip_top])
  }

  topn(count : number) : Array<Element>  {
    return this.stack.slice(this.dip_top, this.dip_top + count)
  }

  drop(count : number) : Array<Element> {
    return this.stack.splice(this.dip_top, count)
  }
  dropAt(index : number) : Element {
    const [result] = this.stack.splice(this.dip_top + index, 1)
    if (!result)
      throw `dropAt / error when stack drops element at index:${index}`

    return result
  }

  empty() {
    this.stack = []
    this.dip_top = 0
  }

  insert(elem : Element) {
    this.stack.splice(this.dip_top, 0, elem)
  }
  insertAt(index : number, elem : Element) {
    this.stack.splice(this.dip_top + index, 0, elem)
  }

  clone() {
    const result = new Stack(this.stack.map(item => item.clone()))
    result.dip_top = this.dip_top
    result.conditions = this.conditions.map(x => x.clone())
    return result
  }

  countElements() : Array<number> {
    const walk = (elem : Element) => {
      return 1 + (elem.subs.length ? elem.subs.reduce((acc, x) => acc + walk(x), 0) : 0)
    }
    
    return this.stack.map(elem => walk(elem))
  }
}

type initArgs = {
  self: string,
  amount: string,
  balance: string,
  chain_id: string,
  source: string,
  sender: string,
  now: string
}

export class Contract {
  stack : Stack
  fail_stacks : Array<Stack>
  code : Array<Object>
  elem_id : {val: number}
  contract : Object
  init_args : initArgs
  
  constructor(contract_raw : Array<Object>, custom_param? : Object, custom_storage? : Object, custom_args? : initArgs) {
    this.contract = {}
    contract_raw.forEach(item => {
      const key = item.prim
      this.contract[key] = item.args[0]
    })
    
    this.elem_id = {val: 1}
    this.code = this.contract.code

    const parameter_raw_elem = createElementByType(
      this.contract.parameter, custom_param || mockValueFromType(this.contract.parameter, this.elem_id), this.elem_id)
    const storage_raw_elem = createElementByType(
      this.contract.storage, custom_storage || mockValueFromType(this.contract.storage, this.elem_id), this.elem_id)
    settingInstrID(parameter_raw_elem, 'P')
    settingInstrID(storage_raw_elem, 'S')

    const parameter_elem = this.newElement(parameter_raw_elem.t, [], 'Parameter', null, [parameter_raw_elem])
    const storage_elem = this.newElement(storage_raw_elem.t, [], 'Storage', null, [storage_raw_elem])

    this.stack = new Stack([
      this.newElement(
        ['pair', readType(this.contract.parameter), readType(this.contract.storage)],
        [], '', null, [parameter_elem, storage_elem]
      )
    ])
    this.fail_stacks = []

    this.init_args = custom_args || {
      self: 'SELF',
      now: 'NOW',
      source: 'SOURCE',
      sender: 'SENDER',
      chain_id: 'CHAIN_ID',
      amount: 'AMOUNT',
      balance: 'BALANCE'
    }
  }

  newElement(
      t : EType, annots : Array<string> = [], 
      instr : string = '', value : Object = null, subs : Array<Element> = []) {
    return new Element(this.elem_id.val++, t, annots, instr, value, subs)
  }

  walkCode(code : Array<Object>, stack : Stack) : Stack {
    for (let i = 0; i < code.length; i++) {
      const instr = code[i]
      
      if (instr instanceof Array) {
        stack = this.walkCode(instr, stack)
        if (stack.is_failed())
          return stack
        else 
          continue
      }

      if (!(instr.prim in instrs)) {
        debugger
        throw `walkCode / unhandled instr: ${instr.prim}`
      }

      stack = instrs[instr.prim](this, stack, instr)

      if (stack.is_failed())
        return stack
    }

    return stack
  }

  walkToExit() {
    this.fail_stacks = []
    return this.walkCode(this.code, this.stack.clone())
  }

  genReplaceMap() {
    const paths = []
    const walk = (elem : Element, path : Array<Element | string>) => {
      const p0 = path.slice()
      p0.unshift(elem)
      paths.push(p0)

      if (elem.t[0] === 'pair') {
        const p1 = path.slice()
        p1.unshift('PAIR.0')
        const p2 = path.slice()
        p2.unshift('PAIR.1')

        walk(elem.subs[0], p1)
        walk(elem.subs[1], p2)
      } else if (elem.t[0] === 'or') {
        if (elem.instr === 'Left') {
          const p1 = path.slice()
          p1.unshift('OR.LEFT')
          walk(elem.subs[0], p1)

        } else if (elem.instr === 'Right') {
          const p2 = path.slice()
          p2.unshift('OR.RIGHT')
          walk(elem.subs[0], p2)

        } else {
          const p1 = path.slice()
          p1.unshift('OR.LEFT')
          walk(elem.subs[0], p1)
  
          const p2 = path.slice()
          p2.unshift('OR.RIGHT')
          walk(elem.subs[1], p2)
        }
      }
    }
    walk(this.stack.top().subs[0].subs[0], ['Parameter'])
    walk(this.stack.top().subs[1].subs[0], ['Storage'])

    const replace_mapping = {}
    paths.forEach(path => {
      let cursor : Object = replace_mapping
      path.forEach((item, index) => {
        if (!index) return;
        if (item instanceof Element) return;

        if (index === path.length - 1)
          cursor[item] = path[0]
        else {
          if (!(item in cursor))
            cursor[item] = {}

          cursor = cursor[item]
        }
      })
    })

    return replace_mapping
  }

  genInstrPattern() {
    const mergeObj = (a : Object, b : Object, path : Array<0 | 1>) => {
      for (const key in b) {
        if (b[key] === true) {
          a[key] = (elem : Element, render : (elem : Element) => rec_array) => {
            let cursor = elem.subs[0]
            path.forEach(i => cursor = cursor.subs[0])
            for (let l = path.length; l--;) {
              cursor = cursor.subs[path[l]]
            }
            return cursor.annots.length ? [cursor.annots[0]] : render(cursor)
          }
        } else {
          if (!(key in a))
          a[key] = {}

          mergeObj(a[key], b[key], path.concat({
            'PAIR.0': 0,
            'PAIR.1': 1,
            'OR.LEFT': 0,
            'OR.RIGHT': 1,
            'ITEM.0': 0,
            'OPTION.0': 0
          }[key]))
        }
      }
    }

    const walk = (elem : Element, root : Object, result : Object) : Object => {
      if (elem.t[0] === 'pair') {
        walk(elem.subs[0], {'PAIR.0': root}, result)
        walk(elem.subs[1], {'PAIR.1': root}, result)
        mergeObj(result, {
          'PAIR.0': root,
          'PAIR.1': root
        }, [])

      } else if (elem.t[0] === 'or') {
        walk(elem.subs[0], {'OR.LEFT': root}, result)
        walk(elem.subs[1], {'OR.RIGHT': root}, result)
        mergeObj(result, {
          'OR.LEFT': root,
          'OR.RIGHT': root
        }, [])

      } else if (elem.t[0] === 'list') {
        walk(elem.subs[0], {'ITEM.0': root}, result)

      } else if (elem.t[0] === 'option' && elem.subs.length) {
        walk(elem.subs[0], {'OPTION.0': root}, result)

      } else {
        mergeObj(result, root, [])
      }
    }
    
    const result = {
      Parameter(elem : Element, render : (elem : Element) => rec_array) {
        return ['Parameter']
      },
      Storage(elem : Element, render : (elem : Element) => rec_array) {
        return ['Storage']
      }
    }

    walk(this.stack.top().subs[0].subs[0], {Parameter: true}, result)
    walk(this.stack.top().subs[1].subs[0], {Storage: true}, result)

    return result
  }
}