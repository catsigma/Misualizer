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
  GT(elem : Element, render : renderFn) {
    return `${render(elem.subs[0].subs[0])} > ${render(elem.subs[0].subs[1])}`
  },
  IF_NONE(elem : Element, render : renderFn) {
    return `If ${render(elem.subs[0])} is None then ${render(elem.subs[1])} else ${render(elem.subs[2])}`
  }
}