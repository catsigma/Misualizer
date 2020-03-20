// @flow

type VType = Array<string | VType>

import { StackItem, Stack } from './stack'
import { get_t } from './instr'

function generalOutput(item : StackItem) {
  return `${item.instr}(${item.subs.map(x => x.toString()).join(', ')})`
}

export function tToString(t : VType | string) {
  if (typeof t === 'string')
    return t

  return `${t[0].toString()}` + (
   t.length > 1 ? `<${t.slice(1).map(x => typeof x === 'string' ? x : tToString(x)).join(', ')}>`
   : '')
}

export const type_mapping = {
  fail(item : StackItem) {
    const reason = item.getSub({index: 0})
    return `FAILWITH: ${reason ? reason.toString() : ''}`
  },
  pair(item : StackItem) {
    return `(${item.subs[0].toString()}, ${item.subs[1].toString()})`
  }
}

export const instr_mapping = {
  'IF_NONE.SOME'(item : StackItem) {
    const v = item.getSub({index: 0})
    if (v) {
      v.t = get_t(v.t[1])
      return v.toString()
    } else {
      return generalOutput(item)
    }
  },
  'IF_LEFT.LEFT'(item : StackItem) {
    return `(${item.subs[0].toString()}).left`
  },
  'IF_LEFT.RIGHT'(item : StackItem) {
    return `(${item.subs[0].toString()}).right`
  },
  'Left|Right'(item : StackItem) {
    return `(${item.subs[0].toString()} | ${item.subs[1].toString()})`
  },
  COMPARE_BASE(item : StackItem, symbol : string) {
    const v = item.getSub({index: 0, instr: 'COMPARE'})
    return v ? `${v.subs[0].toString()} ${symbol} ${v.subs[1].toString()}` : generalOutput(item)
  },
  EQ(item : StackItem) {
    return instr_mapping.COMPARE_BASE(item, '==')
  },
  NEQ(item : StackItem) {
    return instr_mapping.COMPARE_BASE(item, '!=')
  },
  GE(item : StackItem) {
    return instr_mapping.COMPARE_BASE(item, '>=')
  },
  LE(item : StackItem) {
    return instr_mapping.COMPARE_BASE(item, '<=')
  },
  GT(item : StackItem) {
    return instr_mapping.COMPARE_BASE(item, '>')
  },
  LT(item : StackItem) {
    return instr_mapping.COMPARE_BASE(item, '<')
  },
  ADD(item : StackItem) {
    return `(${item.subs[0].toString()} + ${item.subs[1].toString()})`
  },
  MUL(item : StackItem) {
    return `${item.subs[0].toString()} * ${item.subs[1].toString()}`
  },
  EDIV(item : StackItem) {
    return `${item.subs[0].toString()} / ${item.subs[1].toString()}`
  },
  NIL(item : StackItem) {
    return `[]`
  },
  CONS(item : StackItem) {
    const v = item.getSub({index: 1, instr: 'NIL'})
    return v ? `[${item.subs[0].toString()}]` : generalOutput(item)
  }
}