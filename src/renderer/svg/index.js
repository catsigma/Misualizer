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

  drawMock(graph : Object) {
    const top_text = Text([0,0], graph.name, .5)
    const levels = {
      0: [top_text]
    }
    const links = []

    const walk = (paths : Array<Object>, parent_graph : Component, level : number) => {
      if (!levels[level])
        levels[level] = []

      paths.forEach(path => {
        if (path.name) {
          const text = Text([0,0], path.name, .5)
          links.push([parent_graph, text])
          levels[level].push(text)
          parent_graph = text
        } else if (path.kind === 'branch') {
          walk(path.path, parent_graph, level + 1)
        }
      })

    }

    walk(graph.paths[0], top_text, 1)

    const result = []
    for (let level in levels) {
      levels[level].forEach((item, index) => {
        if (index) {
          item.relocate([
            levels[level][index - 1].key_points[1][0] + 5,
            (+level + 1) * 50  
          ])
        } else {
          item.relocate([20, (+level + 1) * 50])
        }

        result.push(item)
      })
    }

    links.forEach(link => {
      result.push(AutoCurve(link[0], link[1], false))
    })

    return new Component(result)
  }

  renderMockData(graph : Object, width : number = 1000, height : number = 1000) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    const component = this.drawMock(graph)
    svg.appendChild(component.el)
    return svg
  }
}