// @flow

import { throttle } from '../../utils'

import { Element } from '../../emu/elem'
import type { EType } from '../../emu/elem'
import { Stack } from '../../emu/contract'
import { genGraphNode, readElem } from './repr'
import type { GraphNode } from './repr'

import { Component, Rect, Arrow, Curve, AutoCurve, Text, TextBlock } from './components'

function bindMouseControl(svg : Object, zoom_in : Object, zoom_out : Object) {
  const getViewBox = () => svg.getAttribute('viewBox').split(' ').map(x => parseInt(x))
  let [x, y, width, height] = getViewBox()

  let start_moving = false
  let cursor = [0, 0]
  svg.addEventListener('mousedown', (e) => {
    cursor = [e.clientX, e.clientY]
    start_moving = true
  })
  svg.addEventListener('mousemove', throttle((e) => {
    if (!start_moving) return false

    svg.setAttribute('viewBox', `${x + cursor[0] - e.clientX} ${y + cursor[1] - e.clientY} ${width} ${height}`)
  }))

  const leaveFn = (e) => {
    if (start_moving) {
      x += cursor[0] - e.clientX
      y += cursor[1] - e.clientY
    }
    start_moving = false
  }
  svg.addEventListener('mouseup', leaveFn)
  svg.addEventListener('mouseleave', leaveFn)

  zoom_in.addEventListener('click', (e) => {
    e.preventDefault()

    const offset = -100
    if (width <= 100 || height <= 100)
      return;
      
    width += offset
    height += offset

    x -= offset / 2
    y -= offset / 2
    svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`)
  })
  zoom_out.addEventListener('click', (e) => {
    e.preventDefault()
    
    const offset = 100
    width += offset
    height += offset

    x -= offset / 2
    y -= offset / 2
    svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`)
  })
}

export class SVGRenderer {
  selected : {
    graph_node : GraphNode | null,
    svg_elem : Component | null
  }

  constructor() {
    this.selected = {
      graph_node: null,
      svg_elem: null
    }
  }

  createSVG(size : [number, number], elem : Object) {
    const wrapper = document.createElement('div')
    wrapper.className = 'svg-wrapper'
    const zoom_in = document.createElement('div')
    zoom_in.className = 'zoom-in'
    const zoom_out = document.createElement('div')
    zoom_out.className = 'zoom-out'

    const svg : Object = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.style.border = '1px solid #d79b7d'
    svg.style.width = '100%'
    svg.style.height = size[1]

    const view_box = [-size[0] / 2, 40, size[0], size[1]]
    svg.setAttribute('viewBox', view_box.join(' '))
    bindMouseControl(svg, zoom_in, zoom_out)
    svg.appendChild(elem)

    wrapper.appendChild(zoom_in)
    wrapper.appendChild(zoom_out)
    wrapper.appendChild(svg)
    return wrapper
  }

  renderData(elem : Element) {
    const size = [-1, -1]

    const levels = {}
    const links = {}
    const walk = (el : Element, level : number) => {
      const content = readElem(el)
      const graph = Text([0, 0], content, 1.2)

      if (!(level in levels)) {
        levels[level] = []
        links[level] = []
      }

      levels[level].push(graph)

      el.subs.forEach(x => {
        links[level].push({
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
      
      const lefts = []
      const mids = []
      let width_sum = 0
      elems.forEach((x, index) => {
        const width = x.key_points[1][0] - x.key_points[3][0]
        lefts.push(width_sum)
        mids.push(width_sum + width / 2)
        width_sum += width + 20
      })

      if (width_sum > size[0])
        size[0] = width_sum
      if (parseInt(level) * 50 > size[1])
        size[1] = parseInt(level) * 50

      let offset = 0
      if (level === '1') {
        offset = 0
      } else {
        links[parseInt(level) - 1].forEach((link, index) => {
          const from_mid = link.from.key_points[0][0]
          offset += mids[index] - from_mid
        })
        offset /= elems.length
      }

      elems.forEach((x, index) => {
        x.relocate([lefts[index] - offset, parseInt(level) * 50])
        graphs_relocated.push(x)
      })
    }

    for (const level in links) {
      links[level].forEach(link => {
        graphs_relocated.push(AutoCurve(link.from, link.to, true))
      })
    }

    return this.createSVG([screen.width, size[1]], new Component(graphs_relocated).el)
  }

  render(stack : Stack) {
    return this.renderGraphNode(genGraphNode(stack.stack[0]))
  }

  renderTree(tree : Object, mapping : {number: Element}) {
    const walk = (node : Object, graph_node : GraphNode) => {
      for (const key in node) {
        const graph = genGraphNode(mapping[key])
        graph_node.children.push(graph)

        if (node[key] instanceof Element) {
          const result_graph = genGraphNode(node[key])
          result_graph.title = 'RESULT -> ' + result_graph.title
          graph.children.push(result_graph)
        } else {
          walk(node[key], graph)
        }
      }
    }
    const result = {
      title: '',
      elem: new Element(0, []),
      children: []
    }
    walk(tree, result)
    
    return this.renderGraphNode(result)
  }

  renderGraphNode(graph_node : GraphNode) {
    const size = [-1, -1]

    const levels = {}
    const links = {}
    const walk = (node : GraphNode, level : number, in_flow : bool = true) => {
      const len_limit = 40
      const title = node.title.length > len_limit ? node.title.slice(0, len_limit) + '...' : node.title
      const graph = Text([0, 0], title, 1.2)
      if (node.title.length > len_limit) {
        graph.setStyles({
          cursor: 'pointer',
          textDecoration: 'underline'
        })
  
        graph.on('click', () => {
          this.selected.graph_node = node
          this.selected.svg_elem = graph
        })
      }

      if (title.slice(0, 6) === 'RESULT')
        graph.setStyles({
          fill: 'red'
        })

      if (!(level in levels)) {
        levels[level] = []
        links[level] = []
      }

      graph.setStyles({
        opacity: in_flow ? '1' : '0.1'
      })
        
      levels[level].push(graph)

      node.children.forEach((x, index) => {
        const next_in_flow = 
          node.direction ? 
          ((node.direction === 'left' && index === 0) || (node.direction === 'right' && index === 1)) : 
          in_flow

        links[level].push({
          from: graph,
          in_flow: next_in_flow,
          to: walk(x, level + 1, next_in_flow)
        })
      })

      return graph
    }
    walk(graph_node, 1)

    const graphs_relocated = []
    for (const level in levels) {
      const elems = levels[level]
      
      const lefts = []
      const mids = []
      let width_sum = 0
      elems.forEach((x, index) => {
        const width = x.key_points[1][0] - x.key_points[3][0]
        lefts.push(width_sum)
        mids.push(width_sum + width / 2)
        width_sum += width + 20
      })

      if (width_sum > size[0])
        size[0] = width_sum
      if (parseInt(level) * 50 > size[1])
        size[1] = parseInt(level) * 50

      let offset = 0
      if (level === '1') {
        offset = 0
      } else {
        links[parseInt(level) - 1].forEach((link, index) => {
          const from_mid = link.from.key_points[0][0]
          offset += mids[index] - from_mid
        })
        offset /= elems.length
      }

      elems.forEach((x, index) => {
        x.relocate([lefts[index] - offset, parseInt(level) * 100])
        graphs_relocated.push(x)
      })
    }

    for (const level in links) {
      links[level].forEach(link => {
        const ac = AutoCurve(link.from, link.to, true)
        ac.setStyles({opacity: link.in_flow ? '1' : '0.1'})
        graphs_relocated.push(ac)
      })
    }

    return this.createSVG([screen.width, size[1] * 2], new Component(graphs_relocated).el)
  }
}