// @flow

import { Component, Rect, Arrow, Curve, AutoCurve, Text } from './components'

export class SVGRenderer {
  constructor() {

  }

  drawNodes(start_node : string | Object, nodes : Array<{arrow: string, node: string | Object}>) {
    const drawNode = (node : string | Object) => {
      if (typeof node === 'string')
        return Text([800 * Math.random(), 400 * Math.random()], node)
      else
        return Rect([800 * Math.random(), 400 * Math.random()], 20, 20)
    }

    const graphs = []
    graphs.push(drawNode(start_node))

    nodes.forEach((item, index) => {
      graphs.push(drawNode(item.node))
      if (index) {
        graphs.push(AutoCurve(graphs[graphs.length - 3], graphs[graphs.length - 1], true))
      } else {
        graphs.push(AutoCurve(graphs[0], graphs[1], true))
      }
    })

    return graphs
  }

  render(graph : Object) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 1000 1000')
    console.log(graph)
    const nodes = graph.paths.map(x => this.drawNodes(x.start_node, x.nodes))
    nodes.forEach(x => {
      x.forEach(x => svg.appendChild(x.el))
    })
    return svg
  }
}