// @flow

import { Element } from '../../emu/elem'
import { Stack } from '../../emu/contract'
import { renderElement, t_reprs, instr_reprs } from '../repr'
import type { rec_array } from '../repr'

import { Component, Rect, Arrow, Curve, AutoCurve, Text, TextBlock } from './components'


export class SVGRenderer {
  stack : Stack
  patterns : Array<Object>

  constructor(stack : Stack, pattern? : Object) {
    this.stack = stack
    this.patterns = pattern ? [pattern, instr_reprs] : [instr_reprs]
  }

  renderData(elem : Element, size: [number, number]) {
    const walk = (el : Element) => {
      if (el.t[0] === 'or') {

      }
      return (el.annots.length ? [el.t[0].toString() + ' <- ' + el.annots[0]] : [el.instr]).concat(el.subs.map(x => walk(x)))
    }

    const result = walk(elem)
    console.log(result)

    const svg : Object = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.style.border = '1px solid red'
    svg.style.width = size[0]
    svg.style.height = size[1]

    svg.setAttribute('viewBox', `0 0 ${size[0]} ${size[1]}`)
    return svg
  }

  render(elem? : Element, size: [number, number]) {
    const result = elem ? renderElement(elem, this.patterns) : 
        this.stack.stack.map(elem => renderElement(elem, this.patterns))

    const svg : Object = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.style.border = '1px solid red'
    svg.style.width = size[0]
    svg.style.height = size[1]

    svg.setAttribute('viewBox', `0 0 ${size[0]} ${size[1]}`)
    return svg
  }
}