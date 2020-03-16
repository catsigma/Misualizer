// @flow

type VType = Array<string | VType>

import { StackItem, Stack } from './stack'

export function tToString(t : VType) {
  return `${t[0].toString()}` + (
   t.length > 1 ? `<${t.slice(1).map(x => typeof x === 'string' ? x : tToString(x)).join(', ')}>`
   : '')
}

export const type_mapping = {
  pair(item : StackItem) {
    return `(${item.subs[0].toString()}, ${item.subs[1].toString()})`
  }
}

export const instr_mapping = {
  'Left|Right'(item : StackItem) {
    return `(${item.subs[0].toString()} | ${item.subs[1].toString()})`
  }
}