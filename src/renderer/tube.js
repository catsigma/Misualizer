// @flow

import { Tube, Joint, Valve } from '../emu/tube/tube'
import { throttle } from '../utils'
import { TubeGraph, JointGraph, Graph } from './graph'

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
  constructor() {
  }
  
  renderValve(valve : Valve) {
    const graphs = []
    const walk = (node : Tube | Joint | null, start_point : [number, number]) => {
      if (!node || !node.id)
        return;
        
      if (node instanceof Tube) {
        const {graph, end_point} = TubeGraph(start_point)
        graph.on('click', () => {
          console.log(node)
        })
        graphs.push(graph)
        walk(node.next, end_point)
      } else if (node instanceof Joint) {
        const {graph, end_points} = JointGraph(start_point, node.nexts.length)
        graph.on('click', () => {
          console.log(node)
        })
        graphs.push(graph)
        node.nexts.forEach((next, i) => walk(next, end_points[i]))
      }
    }
    walk(valve.start.node, [0, 0])

    return this.createSVG([screen.width, 1000], new Graph(graphs).el)
  }

  renderTube(tube : Tube) {
    // const elem = TubeGraph([0, 0], 100)
    // return this.createSVG([screen.width, 200], elem.el)
  }

  renderJoint(joint : Joint) {

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
}