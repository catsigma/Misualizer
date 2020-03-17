// @flow

type VType = Array<string | VType>

import { StackItem, Stack } from './stack'

function generalOutput(item : StackItem) {
  return `${item.instr}(${item.subs.map(x => x.toString()).join(', ')})`
}

export function tToString(t : VType) {
  return `${t[0].toString()}` + (
   t.length > 1 ? `<${t.slice(1).map(x => typeof x === 'string' ? x : tToString(x)).join(', ')}>`
   : '')
}

export const type_mapping = {
  fail(item : StackItem) {
    const reason = item.getSub(0, '')
    return `FAILWITH: ${reason ? reason.toString() : ''}`
  },
  pair(item : StackItem) {
    return `(${item.subs[0].toString()}, ${item.subs[1].toString()})`
  }
}

export const instr_mapping = {
  'IF_LEFT.LEFT'(item : StackItem) {
    const v = item.getSub(0, 'Left|Right', 0, '')
    return v ? v.toString() : `(${item.subs[0].toString()}).LEFT`
  },
  'IF_LEFT.RIGHT'(item : StackItem) {
    const v = item.getSub(0, 'Left|Right', 1, '')
    return v ? v.toString() : `(${item.subs[0].toString()}).RIGHT`
  },
  'Left|Right'(item : StackItem) {
    return `(${item.subs[0].toString()} | ${item.subs[1].toString()})`
  },
  COMPARE_BASE(item : StackItem, symbol : string) {
    const v = item.getSub(0, 'COMPARE')
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
  }
}