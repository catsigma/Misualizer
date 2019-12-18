// @flow

import { Element } from '../emu/elem'

type renderFn = (elem : Element, level? : number) => string

function indent(num : number) {
  return ' '.repeat(num)
}

export const t_reprs = {
  fail(elem : Element, level: number, render : renderFn) {
    return `fail(${render(elem.subs[0])})`
  },
  pair(elem : Element, level: number, render : renderFn) {
    return `(${render(elem.subs[0])}, ${render(elem.subs[1])})`
  },
  list(elem : Element, level: number, render : renderFn) {
    return `[${elem.subs.map(x => render(x)).join(', ')}]`
  },
  string(elem : Element, level: number, render : renderFn) {
    return `"${elem.value}"`
  },
  map(elem : Element, level: number, render : renderFn) {
    return `{${elem.subs.map(x => `${render(x.subs[0])}: ${render(x.subs[1])}`).join(', ')}}`
  }
}

export const instr_reprs = {
  Parameter(elem : Element, level: number, render : renderFn) {
    return `Parameter`
  },
  Storage(elem : Element, level: number, render : renderFn) {
    return `Storage`
  },
  GT(elem : Element, level: number, render : renderFn) {
    return `${render(elem.subs[0].subs[0])} > ${render(elem.subs[0].subs[1])}`
  },
  IF(elem : Element, level: number, render : renderFn) {
    return `If ${render(elem.subs[0])} then ${render(elem.subs[1], level + 2)} \n${indent(level)}else ${render(elem.subs[2], level + 2)}`
  },
  IF_NONE(elem : Element, level: number, render : renderFn) {
    return `If ${render(elem.subs[0])} is None then ${render(elem.subs[1], level + 2)} \n${indent(level)}else ${render(elem.subs[2], level + 2)}`
  },
  IF_LEFT(elem : Element, level: number, render : renderFn) {
    const left = elem.subs[0].instr === 'Parameter' ? elem.subs[0].subs[0].subs[0] : elem.subs[0].subs[0]
    return `If ${render(elem.subs[0])} is ${render(left)} then ${render(elem.subs[1], level + 2)} \n${indent(level)}else ${render(elem.subs[2], level + 2)}`
  },
  ADD(elem : Element, level: number, render : renderFn) {
    return `${render(elem.subs[0])} + ${render(elem.subs[1])}`
  },
  SUB(elem : Element, level: number, render : renderFn) {
    return `${render(elem.subs[0])} - ${render(elem.subs[1])}`
  },
  EQ: {COMPARE(elem : Element, level: number, render : renderFn) {
    const item = elem.subs[0]
    return `(${render(item.subs[0])}) == (${render(item.subs[1])})`
  }},
  CONS(elem : Element, level: number, render : renderFn) {
    if (elem.subs[1].instr === 'NIL')
      return `[${render(elem.subs[0])}]`

    return `[${render(elem.subs[0])}] + ${render(elem.subs[1])}`
  },
  NIL() {
    return `[]`
  },
  'OPTION.0': {
    GET(elem : Element, level: number, render : renderFn) {
      const get = elem.subs[0]
      return `${render(get.subs[1])}[${render(get.subs[0])}]`
    }
  },
  UPDATE(elem : Element, level: number, render : renderFn) {
    return `${render(elem.subs[2])}[${render(elem.subs[0])}] = (${render(elem.subs[1])})`
  }
}
