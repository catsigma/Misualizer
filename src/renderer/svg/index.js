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
    const levels = {}
    const links = []
    const walk = (el : Element, level : number) => {
      const content = el.annots.length ? `${el.annots[0]}:${el.t[0].toString()}` : (el.instr || el.t[0].toString())
      const graph = Text([0, 0], content, 1.2)

      if (!(level in levels))
        levels[level] = []

      levels[level].push(graph)

      el.subs.forEach(x => {
        links.push({
          from: graph,
          to: walk(x, level + 1)
        })
      })
      return graph
    }
    walk(elem, 1)

    const graphs_relocated = []
    for (const level in levels) {
      const elems = levels[level]
      
      const lefts = [0]
      let width_sum = 0
      elems.forEach((x, index) => {
        const width = x.key_points[1][0] - x.key_points[3][0] + 20
        if (index)
          lefts.push(width_sum)

        width_sum += width
      })

      const left_start = size[0] / 2 - width_sum / 2
      elems.forEach((x, index) => {
        x.relocate([left_start + lefts[index], parseInt(level) * 50])
        graphs_relocated.push(x)
      })
    }

    links.forEach(link => {
      graphs_relocated.push(AutoCurve(link.from, link.to, true))
    })

    const svg : Object = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.style.border = '1px solid red'
    svg.style.width = size[0]
    svg.style.height = size[1]

    svg.setAttribute('viewBox', `0 0 ${size[0]} ${size[1]}`)
    svg.appendChild(new Component(graphs_relocated).el)
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