// @flow

import { Component, Rect, Arrow, Curve, AutoCurve, Text } from './components'

export class SVGRenderer {
  position : [number, number]

  constructor() {
    this.position = [100, 20]
  }

  getPosition() {
    const result = this.position
    this.position = [{
      [300]: 500,
      [500]: 100,
      [100]: 300
    }[this.position[0]], this.position[1] + 25] 
    return result
  }

  drawPath(path : Array<Object>, prev_graph? : Component) {
    const graphs = []

    path.forEach((node, index) => {
      if (!index) {
        graphs.push(Text(this.getPosition(), node.name))
        if (prev_graph) {
          const curve = AutoCurve(
            prev_graph, 
            graphs[0], 
            node.kind === 'arrow-node', 
            node.arrow,
            node.kind === 'arrow-node' ? undefined : {
              stroke: 'gray',
              'stroke-width': '2',
            }) 
          graphs.push(curve)
        }
        prev_graph = graphs[0]
      } else if (node.kind === 'arrow-node') {
        graphs.push(Text(this.getPosition(), node.name))

        if (prev_graph)
          graphs.push(AutoCurve(prev_graph, graphs[graphs.length - 1], true, node.arrow))

        prev_graph = graphs[graphs.length - 2]
      } else if (node.kind === 'branch') {
        graphs.push(this.drawPath(node.path, prev_graph))
      }

      if (node.paths) {
        const inside_nodes = new Component(node.paths.map(path => this.drawPath(path, prev_graph)))
        inside_nodes.hide()
        if (prev_graph)
          prev_graph.on('click', () => {inside_nodes.toggle()})

        graphs.push(inside_nodes)
      }
    })

    return new Component(graphs)
  }

  render(graph : Object, width : number = 1000, height : number = 1000) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    const component = this.drawPath([graph])
    svg.appendChild(component.el)
    return svg
  }
}