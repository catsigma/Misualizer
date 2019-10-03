// @flow

import { Component, Rect, Arrow, Curve, AutoCurve, Text } from './components'

export class SVGRenderer {
  constructor() {

  }

  drawPath(path : Array<Object>, prev_graph? : Component) {
    const graphs = []

    path.forEach((node, index) => {
      if (!index) {
        graphs.push(Text([800 * Math.random(), 400 * Math.random()], node.name))
        if (prev_graph) {
          graphs.push(AutoCurve(prev_graph, graphs[0], true))
        }
        prev_graph = graphs[0]
      } else if (node.kind === 'arrow-node') {
        graphs.push(Text([800 * Math.random(), 400 * Math.random()], node.name))
        if (prev_graph)
          graphs.push(AutoCurve(prev_graph, graphs[graphs.length - 1], true))

        prev_graph = graphs[graphs.length - 2]
      } else if (node.kind === 'branch') {
        graphs.push(this.drawPath(node.path, prev_graph))
      }

      if (node.paths)
        graphs.push(new Component(node.paths.map(path => this.drawPath(path, prev_graph))))
    })

    return new Component(graphs)
  }

  render(graph : Object) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 1000 1000')
    console.log(graph)
    const component = this.drawPath(graph.paths[0])
    svg.appendChild(component.el)
    return svg
  }
}