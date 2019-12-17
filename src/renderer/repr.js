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
  IF_NONE(elem : Element, render : renderFn) {
    return `\n\tIf ${render(elem.subs[0])} is None\n\tthen ${render(elem.subs[1])}\n\telse ${render(elem.subs[2])}`
  },
  IF_LEFT(elem : Element, render : renderFn) {
    return `\nIf ${render(elem.subs[0])} is Left\nthen ${render(elem.subs[1])}\nelse ${render(elem.subs[2])}`
  },
  'OR.LEFT': {
    Parameter(elem : Element, render : renderFn) {
      return render(elem.subs[0].subs[0].subs[0])
    }
  },
  'OR.RIGHT': {
    Parameter(elem : Element, render : renderFn) {
      return render(elem.subs[0].subs[0].subs[1])
    }
  }
}
