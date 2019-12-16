// @flow

import { Element } from '../emu/elem'

type renderFn = (elem : Element) => string

export const reprs = {
  pair(elem : Element, render : renderFn) {
    return `(${render(elem.subs[0])}, ${render(elem.subs[1])})`
  },
  int(elem : Element, renderer : renderFn) {
    return elem.value
  },
  bool(elem : Element, renderer : renderFn) {
    return elem.value
  }
}