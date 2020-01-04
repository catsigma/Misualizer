// @flow

import { Element } from '../emu/elem'
import type { EType } from '../emu/elem'

export type rec_array = Array<string | rec_array>
type renderFn = (elem : Element) => rec_array

function getInstrRepr(elem : Element, pattern : Object) {
  let cursor_left = elem
  let cursor_right = pattern[cursor_left.instr]
  let last_handler = null

  while (cursor_left && cursor_right) {
    if (cursor_right instanceof Function)
      last_handler = cursor_right

    cursor_left = cursor_left.subs[0]
    cursor_right = cursor_right[cursor_left.instr]
  }

  return last_handler
}


function findReplacement(elem : Element, pattern : Object) {
  let cursor_left = elem
  let cursor_right = pattern[cursor_left.instr]

  while (cursor_left && cursor_right) {
    if (cursor_right instanceof Element) {
      return cursor_right
    }

    cursor_left = cursor_left.subs[0]
    cursor_right = cursor_right[cursor_left.instr]
  }

  return null
}

export function replaceElement(elem : Element, pattern : Object) : Element {
  if (elem.subs.length) {
    const replacement = findReplacement(elem, pattern)
    if (replacement)
      return replacement
    else {
      elem.subs = elem.subs.map(x => replaceElement(x, pattern))
      return elem
    }
  } else
    return elem
}

export function renderElement(elem : Element, patterns : Array<Object>) : rec_array {
  if (elem.instr && elem.subs.length) {
    // apply instr patterns
    for (let i = 0; i < patterns.length; i++) {
      const handler = getInstrRepr(elem, patterns[i])
      if (handler)
        return handler(elem, (elem) => renderElement(elem, patterns))
    }

    return [elem.instr].concat(elem.subs.map(x => renderElement(x, patterns)))
  } else {
    const t = elem.t[0].toString()

    if (t_reprs[t]) {
      return t_reprs[t](elem, (elem) => renderElement(elem, patterns))
    } else if (elem.annots.length) {
      return [elem.annots[0] + ':' + elem.t[0].toString()]
    } else if (elem.value !== null) {
      return [elem.value]
    } else {
      debugger
      throw `renderElement / unhandled type: ${t}`
    }
  }
}


export const t_reprs = {
  fail(elem : Element, render : renderFn) : rec_array {
    const reasons = elem.subs.slice(1)
    return ['fail', render(elem.subs[0]), reasons.map(reason => render(reason))]
  },
  pair(elem : Element, render : renderFn) : rec_array {
    return ['pair', [render(elem.subs[0]), render(elem.subs[1])]]
  },
  list(elem : Element, render : renderFn) : rec_array {
    return ['list', elem.subs.map(x => render(x))]
  },
  set(elem : Element, render : renderFn) : rec_array {
    return ['set', elem.subs.map(x => render(x))]
  },
  string(elem : Element, render : renderFn) : rec_array {
    return [`"${elem.value}"`]
  },
  map(elem : Element, render : renderFn) : rec_array {
    return ['map', elem.subs.map(x => [render(x.subs[0]), render(x.subs[1])])]
  },
  big_map(elem : Element, render : renderFn) : rec_array {
    return ['big_map', elem.subs.map(x => [render(x.subs[0]), render(x.subs[1])])]
  },
  option(elem : Element, render : renderFn) : rec_array {
    return ['option', elem.t[1]]
  }
}

export const instr_reprs = {
  COND_TRUE(elem : Element, render : renderFn) : rec_array {
    return render(elem.subs[0])
  },
  COND_FALSE(elem : Element, render : renderFn) : rec_array {
    return ['!', render(elem.subs[0])]
  },
  COND_LEFT(elem : Element, render : renderFn) : rec_array {
    return [render(elem.subs[0]), 'is Left']
  },
  COND_RIGHT(elem : Element, render : renderFn) : rec_array {
    return [render(elem.subs[0]), 'is Right']
  },
  COND_ITEM(elem : Element, render : renderFn) : rec_array {
    return [render(elem.subs[0]), 'has item']
  },
  COND_EMPTY(elem : Element, render : renderFn) : rec_array {
    return [render(elem.subs[0]), 'is empty']
  },
  COND_NONE(elem : Element, render : renderFn) : rec_array {
    return [render(elem.subs[0]), 'is None']
  },
  COND_SOME(elem : Element, render : renderFn) : rec_array {
    return [render(elem.subs[0]), 'is Some']
  },

  GT(elem : Element, render : renderFn) : rec_array {
    return [render(elem.subs[0].subs[0]), '>', render(elem.subs[0].subs[1])]
  },
  LT(elem : Element, render : renderFn) : rec_array {
    return [render(elem.subs[0].subs[0]), '<', render(elem.subs[0].subs[1])]
  },
  GE(elem : Element, render : renderFn) : rec_array {
    return [render(elem.subs[0].subs[0]), '>=', render(elem.subs[0].subs[1])]
  },
  LE(elem : Element, render : renderFn) : rec_array {
    return [render(elem.subs[0].subs[0]), '<=', render(elem.subs[0].subs[1])]
  },
  EQ(elem : Element, render : renderFn) : rec_array {
    return [render(elem.subs[0].subs[0]), '==', render(elem.subs[0].subs[1])]
  },
  NEQ(elem : Element, render : renderFn) : rec_array {
    return [render(elem.subs[0].subs[0]), '!=', render(elem.subs[0].subs[1])]
  },
  IF(elem : Element, render : renderFn) : rec_array {
    return ['if', render(elem.subs[0]), render(elem.subs[1]), render(elem.subs[2])]
  },
  IF_NONE(elem : Element, render : renderFn) : rec_array {
    return ['if', render(elem.subs[0]), 'is None', render(elem.subs[1]), render(elem.subs[2])]
  },
  IF_LEFT(elem : Element, render : renderFn) : rec_array {
    return ['if', render(elem.subs[0]), 'is Left', render(elem.subs[1]), render(elem.subs[2])]
  },
  ADD(elem : Element, render : renderFn) : rec_array {
    return [render(elem.subs[0]), '+', render(elem.subs[1])]
  },
  SUB(elem : Element, render : renderFn) : rec_array {
    return [render(elem.subs[0]), '-', render(elem.subs[1])]
  },
  CONS(elem : Element, render : renderFn) : rec_array {
    if (elem.subs[1].instr === 'NIL')
      return ['list', render(elem.subs[0])]

    return ['list', render(elem.subs[0]).concat(render(elem.subs[1]))]
  },
  NIL() {
    return []
  },
  'OPTION.0': {
    GET(elem : Element, render : renderFn) : rec_array {
      const get = elem.subs[0]
      return [render(get.subs[1]), 'get', render(get.subs[0])]
    }
  },
  UPDATE(elem : Element, render : renderFn) : rec_array {
    return [render(elem.subs[2]), '.', render(elem.subs[0]), '=', render(elem.subs[1])]
  }
}
