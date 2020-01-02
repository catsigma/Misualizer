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
      const content = el.annots.length ? `${el.annots[0]}:${el.t[0].toString()}` : (el.instr || el.t[0].toString())
      const graph = Text([0, 0], content, 1.2)
      
      return {
        graph,
        width: graph.key_points[1][0] - graph.key_points[3][0] + 20,
        children: el.subs.map(x => walk(x))
      }
    }
    const graph_tree = walk(elem)

    const graphs_relocated = []
    const relocate_graph_children = (graph_tree : Object) => {
      const left = graph_tree.graph.key_points[3][0]
      const top = graph_tree.graph.key_points[0][1]
      const center = left + graph_tree.width / 2

      const lefts = []
      let width_sum = 0
      graph_tree.children.forEach((item, index) => {
        if (index) {
          lefts.push(lefts[lefts.length - 1] + graph_tree.children[index - 1].width)
        } else {
          lefts.push(0)
        }
        width_sum += item.width
      })
      const left_start = center - width_sum / 2

      graph_tree.children.forEach((item, index) => {
        item.graph.relocate([left_start + lefts[index], top + 40])
        graphs_relocated.push(item.graph)
        graphs_relocated.push(AutoCurve(graph_tree.graph, item.graph))
        relocate_graph_children(item)
      })

    }
    graph_tree.graph.relocate([500, 10])
    graphs_relocated.push(graph_tree.graph)
    relocate_graph_children(graph_tree)

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