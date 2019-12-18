// @flow

import { Element } from '../emu/elem'

type renderFn = (elem : Element) => string

export const t_reprs = {
  fail(elem : Element, render : renderFn) {
    return `fail(${render(elem.subs[0])})`
  },
  pair(elem : Element, render : renderFn) {
    return `(${render(elem.subs[0])}, ${render(elem.subs[1])})`
  },
  list(elem : Element, render : renderFn) {
    return `[${elem.subs.map(x => render(x)).join(', ')}]`
  },
  string(elem : Element, render : renderFn) {
    return `"${elem.value}"`
  },
  map(elem : Element, render : renderFn) {
    return `{${elem.subs.map(x => `${render(x.subs[0])}: ${render(x.subs[1])}`).join(', ')}}`
  }
}

export const instr_reprs = {
  Parameter(elem : Element, render : renderFn) {
    return `Parameter`
  },
  Storage(elem : Element, render : renderFn) {
    return `Storage`
  },
  GT(elem : Element, render : renderFn) {
    return `${render(elem.subs[0].subs[0])} > ${render(elem.subs[0].subs[1])}`
  },
  IF(elem : Element, render : renderFn) {
    return `If ${render(elem.subs[0])} then ${render(elem.subs[1])} else ${render(elem.subs[2])}`
  },
  IF_NONE(elem : Element, render : renderFn) {
    return `If ${render(elem.subs[0])} is None then ${render(elem.subs[1])} else ${render(elem.subs[2])}`
  },
  IF_LEFT(elem : Element, render : renderFn) {
    return `If ${render(elem.subs[0])} is Left then ${render(elem.subs[1])} else ${render(elem.subs[2])}`
  },
  ADD(elem : Element, render : renderFn) {
    return `${render(elem.subs[0])} + ${render(elem.subs[1])}`
  },
  SUB(elem : Element, render : renderFn) {
    return `${render(elem.subs[0])} - ${render(elem.subs[1])}`
  },
  EQ: {COMPARE(elem : Element, render : renderFn) {
    const item = elem.subs[0]
    return `(${render(item.subs[0])}) == (${render(item.subs[1])})`
  }},
  CONS(elem : Element, render : renderFn) {
    if (elem.subs[1].instr === 'NIL')
      return `[${render(elem.subs[0])}]`

    return `[${render(elem.subs[0])}] + ${render(elem.subs[1])}`
  },
  'OPTION.0': {
    GET(elem : Element, render : renderFn) {
      const get = elem.subs[0]
      return `${render(get.subs[1])}[${render(get.subs[0])}]`
    }
  }
}
