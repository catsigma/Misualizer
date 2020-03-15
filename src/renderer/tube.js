// @flow

import { Tube, Joint, Valve } from '../emu/tube/tube'
import { throttle } from '../utils'
import { TubeGraph, 
         JointGraph, 
         Graph, 
         Curve, 
         CustomCurve, 
         distance,
         linearGradient } from './graph'

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
  graph_mem : {number: Graph}
  onSelect : (Tube | Joint) => void
  
  constructor(onSelect : (Tube | Joint) => void) {
    this.graph_mem = {}
    this.onSelect = onSelect || (() => {})
  }
  
  glowGraphs(graph_id_lst: number[]) {
    const graph_set = new Set(graph_id_lst.map(x => x.toString()))
    for (const id in this.graph_mem) {
      this.graph_mem[id].removeClass('path-selected')
      this.graph_mem[id].addClass('path-unselected')
      if (graph_set.has(id))
        this.graph_mem[id].addClass('path-selected')
    }
  }

  renderValve(valve : Valve) {
    const graph_id_mapping = {}
    const levels = {}
    const links = []

    const walk = (node : Tube | Joint | null, level : number) => {
      if (!node || !node.id || node.id in graph_id_mapping)
        return;
        
      if (!(level in levels)) {
        levels[level] = []
      }

      if (node instanceof Tube) {
        const tube = TubeGraph(node.id + '')
        levels[level].push(Object.assign({}, {node}, tube))
        graph_id_mapping[node.id] = tube

        links.push({
          from: node.id,
          offset: tube.end_offset,
          to: node.next && node.next.id
        })

        walk(node.next, level + 1)

      } else if (node instanceof Joint) {
        const joint = JointGraph(node.nexts.length, node.id + '')
        levels[level].push(Object.assign({}, {node}, joint))
        graph_id_mapping[node.id] = joint

        node.nexts.forEach((next, i) => {
          links.push({
            from: node.id,
            offset: joint.end_offsets[i],
            to: next.id
          })

          walk(next, level + 1)
        })

      } else
        debugger
    }
    walk(valve.start.node, 1)

    let max_width = 0
    let height = 0
    const padding = {x: 30, y: 40}
    const graphs = []
    for (const level in levels) {
      height += padding.y

      const currs = levels[level]
      const width = currs.reduce((acc, x) => acc + x.graph.width() + padding.x, 0)
      max_width = width > max_width ? width : max_width

      let prev_width = 16
      currs.forEach((curr, i) => {
        const w = curr.graph.width()
        curr.graph.relocate([prev_width - width / 2, parseInt(level) * padding.y])
        prev_width += w + padding.x
        graphs.push(curr.graph)
        
        this.graph_mem[curr.node.id] = curr.graph
        curr.graph.on('click', () => this.onSelect(curr.node))

        if (curr.node instanceof Tube) {
          if (!curr.node.next || !curr.node.next.id)
            curr.graph.addClass('end-node')
          
          const last_instr_prim = curr.node.code.length ? 
            curr.node.code[curr.node.code.length - 1].prim : 
            ''

          if (last_instr_prim === 'FAILWITH')
            curr.graph.addClass('fail-node')
        }
      })
    }

    links.forEach(link => {
      if (!link.from || !link.to)
        return;
      
      const origin = graph_id_mapping[link.from].graph.key_points[0]
      const from = [origin[0] + link.offset[0], origin[1] + link.offset[1]]
      const to = graph_id_mapping[link.to].graph.key_points[0]
      
      const mark_x = Math.abs(from[0]) > Math.abs(to[0]) ? from[0] : to[0]
      const curve = to[1] - from[1] !== 22 ?
        CustomCurve(
          from,
          to,
          mark_x + Math.abs(mark_x) / mark_x * 100) :
        Curve(from, to, 'down', 'up', 8)

      graphs.unshift(curve)
    })

    return this.createSVG([max_width + 300, height + 32 * 2], new Graph(graphs).el)
  }

  createSVG(size : [number, number], elem : Object) {
    const wrapper = document.createElement('div')
    wrapper.className = 'svg-wrapper'
    const zoom_in = document.createElement('div')
    zoom_in.innerHTML = '+'
    const zoom_out = document.createElement('div')
    zoom_out.innerHTML = '-'
    ;[zoom_in, zoom_out].forEach(x => {
      x.style.display = 'inline-flex'
      x.style.margin = '4px 0 0 4px'
      x.style.width = '16px'
      x.style.height = '16px'
      x.style.justifyContent = 'center'
      x.style.alignItems = 'center'
      x.style.cursor = 'pointer'
      x.style.fontFamily = 'monospace'
      x.style.border = '1px solid black'
    })

    const svg : Object = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.style.width = '100%'

    // adding defs
    const defs = new Graph('defs')
    const defs_innerHTML = `
      <linearGradient id="tubeLongConnect" gradientTransform="rotate(90)">
        <stop offset="5%" stop-color="#aaa"></stop>
        <stop offset="20%" stop-color="#eee"></stop>
        <stop offset="80%" stop-color="#eee"></stop>
        <stop offset="95%" stop-color="#aaa">
        </stop>
      </linearGradient>

      <filter id="glow" height="130%" width="130%" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="orange"/>
      </filter>
    `
    defs.el.innerHTML = defs_innerHTML
    svg.appendChild(defs.el)

    // adding styles
    const style = document.createElement('style')
    style.innerHTML = `
      .curve {stroke: #aaa} 
      .custom-curve {stroke: url(#tubeLongConnect)}
      .rect {stroke: transparent;}
      .joint .rect {fill: DarkSeaGreen}
      .end-node {fill: CornflowerBlue}
      .fail-node {fill: FireBrick}
      .path-unselected {opacity: 0.3; filter: none}
      .path-selected {opacity: 1; filter: url(#glow)}
      .cursor-pointer {cursor: pointer}
    `
    svg.appendChild(style)

    // setting viewbox
    const view_box = [-size[0] / 2, 0, size[0], size[1]]
    svg.setAttribute('viewBox', view_box.join(' '))
    bindMouseControl(svg, zoom_in, zoom_out)
    svg.appendChild(elem)

    wrapper.appendChild(zoom_in)
    wrapper.appendChild(zoom_out)
    wrapper.appendChild(svg)

    return wrapper
  }
}