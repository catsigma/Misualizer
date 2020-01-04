// @flow

import { throttle } from '../../utils'

import { Element } from '../../emu/elem'
import type { EType } from '../../emu/elem'
import { Stack } from '../../emu/contract'
import { genGraphNode } from './repr'
import type { GraphNode } from './repr'

import { Component, Rect, Arrow, Curve, AutoCurve, Text, TextBlock } from './components'


function bindMouseControl(svg : Object, view_box: [number, number, number, number], zoom_in : Object, zoom_out : Object) {
  let [x, y, width, height] = view_box

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
    width += offset
    x -= offset / 2
    height += offset
    svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`)
  })
  zoom_out.addEventListener('click', (e) => {
    e.preventDefault()
    
    const offset = 100
    width += offset
    x -= offset / 2
    height += offset
    svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`)
  })
}

export class SVGRenderer {
  stack : Stack

  constructor(stack : Stack) {
    this.stack = stack
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
    bindMouseControl(svg, view_box, zoom_in, zoom_out)
    svg.appendChild(elem)

    wrapper.appendChild(zoom_in)
    wrapper.appendChild(zoom_out)
    wrapper.appendChild(svg)
    return wrapper
  }

  readElem(elem : Element) {
    const deep_set = new Set(['option', 'contract'])
    const readT = (t : EType | string, deep : boolean = false) => {
      if (t instanceof Array) {
        if (deep_set.has(t[0]) || deep) {
          return t[0].toString() + 
             (t.length === 1 ? '' : `<${t.slice(1).map(x => readT(x, true)).join(', ')}>`)
        } else 
          return t[0].toString()
      } else 
        return t
    }

    if (elem.annots.length) {
      return elem.annots[0] + ':' + readT(elem.t)
    } else {
      return elem.instr || elem.value || readT(elem.t)
    }
  }

  renderData(elem : Element) {
    const size = [-1, -1]

    const levels = {}
    const links = {}
    const walk = (el : Element, level : number) => {
      const content = this.readElem(el)
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

    return this.createSVG(size, new Component(graphs_relocated).el)
  }

  render() {
    const size = [-1, -1]
    const elem = this.stack.stack[0]

    const levels = {}
    const links = {}
    const walk = (node : GraphNode, level : number) => {
      const graph = Text([0, 0], node.title, 1.2)
      if (node.title.slice(0, 6) === 'RESULT')
        graph.setStyles({
          fill: 'red'
        })

      if (!(level in levels)) {
        levels[level] = []
        links[level] = []
      }

      levels[level].push(graph)

      node.children.forEach(x => {
        links[level].push({
          from: graph,
          to: walk(x, level + 1)
        })
      })

      return graph
    }
    walk(genGraphNode(elem), 1)

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
        graphs_relocated.push(AutoCurve(link.from, link.to, true))
      })
    }

    return this.createSVG([1000, 1200], new Component(graphs_relocated).el)
  }
}