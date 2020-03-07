// @flow

type SVGElement = Object

export type point = [number, number]
export type direction = 'up' | 'down' | 'left' | 'right'

const getBox = (() => {
  const shadow_svg : Object = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  shadow_svg.style.width = '0'
  shadow_svg.style.height = '0'
  shadow_svg.style.border = '0'
  shadow_svg.style.padding = '0'

  if (document.body)
    document.body.appendChild(shadow_svg)

  return (svg_el : Object) => {
    shadow_svg.appendChild(svg_el)
    return svg_el.getBBox()
  }
})()
const getKeyPoints = (svg_el : Object) => {
  const box = getBox(svg_el)

  const horiz_mid = box.x + box.width / 2
  const vert_mid = box.y + box.height / 2

  return [
    [horiz_mid, box.y],
    [box.x + box.width, vert_mid],
    [horiz_mid, box.y + box.height],
    [box.x, vert_mid]
  ]
}

function normalizePoint(point : string) : point {
  const point_lst = point.split(/[\s,]+/)
  if (point_lst.length !== 2)
    throw `invalid svg point: ${point}`

  const result = point_lst.map(x => {
    const result = parseInt(x)
    if (isNaN(result))
      throw `invalid svg point: ${point}`

    return result
  })

  return [result[0], result[1]]
}

function getMidPoint(p1 : point, p2 : point) {
  return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]
}

function pp(point : point) {
  // print point
  return `${point[0]} ${point[1]}`
}

function shift(point : point, direction : direction, factor : number = 50) : point {
  const shift_mapping = {
    up: [0, -factor],
    down: [0, factor],
    left: [-factor, 0],
    right: [factor, 0]
  }

  const shift_point = shift_mapping[direction]
  return [point[0] + shift_point[0], point[1] + shift_point[1]]
}

export function distance(point1 : point, point2 : point, with_sqrt : boolean = true) {
  const square_sum = Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[1], 2)
  return with_sqrt ? Math.sqrt(square_sum) : square_sum
}

function shortest_distance(point_lst1 : Array<point>, point_lst2 : Array<point>, only_index? : Set<number>) {
  let last_d = Number.MAX_SAFE_INTEGER
  let result_index = []
  point_lst1.forEach((point1, index1) => {
    point_lst2.forEach((point2, index2) => {
      if (only_index) {
        if (!only_index.has(index1) || !only_index.has(index2))
          return false
      }

      const d = distance(point1, point2, false)
      if (d < last_d) {
        last_d = d
        result_index = [index1, index2]
      }
    })
  })

  return {
    last_d,
    index1: result_index[0],
    index2: result_index[1]
  }
}

// =============== BASIC GRAPHS GraphS ===============
export class Graph {
  kind : string
  key_points : Array<point>
  el : SVGElement

  constructor(init_info : string | Array<Graph>) {
    if (init_info instanceof Array) {
      this.kind = 'g'
      this.el = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      init_info.forEach(x => this.el.appendChild(x.el))
    } else {
      this.kind = init_info
      this.el = document.createElementNS('http://www.w3.org/2000/svg', init_info)
    }
  }

  setAttrs(attr_mapping : Object) {
    for (let key in attr_mapping) {
      this.el.setAttribute(key, attr_mapping[key])
    }
  }

  setStyles(style_mapping : Object) {
    for (let key in style_mapping) {
      this.el.style[key] = style_mapping[key]
    }
  }

  getAttr(name : string) {
    return this.el.getAttribute(name)
  }

  width() {
    return this.key_points[1][0] - this.key_points[3][0]
  }
  height() {
    return this.key_points[2][1] - this.key_points[0][1]
  }

  relocate(pos : point) {
    const prev_x = this.key_points[3][0]
    const prev_y = this.key_points[0][1]

    this.setAttrs({
      transform: `translate(${pos[0] - prev_x}, ${pos[1] - prev_y})`
    })

    this.key_points.forEach(key_point => {
      key_point[0] += pos[0] - prev_x
      key_point[1] += pos[1] - prev_y
    })
  }

  append(el : SVGElement) {
    this.el.appendChild(el)
  }

  on(event : string, fn : Function) {
    if (!this.el.getAttribute('class'))
      this.el.setAttribute('class', 'with-event')

    this.el.addEventListener(event, fn)
  }

  off(event : string, fn : Function) {
    this.el.removeEventListener(event, fn)
  }

  show() {
    this.el.removeAttribute('display')
  }

  hide() {
    this.el.setAttribute('display', 'none')
  }

  toggle() {
    const is_hidden = this.el.getAttribute('display')
    if (is_hidden)
      this.show()
    else
      this.hide()
  }
}

export const linearGradient = (stops : Object[], attrs : Object) => {
  const g = new Graph('linearGradient')
  g.setAttrs(attrs)
  stops.forEach(x => {
    const stop = new Graph('stop')
    stop.setAttrs(x)
    g.el.appendChild(stop.el)
  })
  return g
}

export const TubeGraph = () => {
  const height = 14
  const [x, y] = [0, 0]

  const start_line = Rect([x, y], 8, 4)
  const end_line = Rect([x, y + height], 8, 4)
  const vert_line = Line([x + 4, y], [x + 4, y + height])

  const graph = new Graph([vert_line, start_line, end_line])
  graph.key_points = [
    [4, 0],
    [8, height / 2],
    [4, height],
    [0, height / 2]
  ]
  
  return {
    graph,
    end_offset: [0, height + 4]
  }
}

export const JointGraph = (count : number) => {
  const [x, y] = [0, 0]

  const width = count * 8 + (count - 1) * 2
  const start_rect = LRect([x, y], width, 8)
  const end_points = [...Array(count)].map<[number, number]>((_, i) => [x + i * 10, y + 10])
  const end_rects = end_points.map(p => LRect(p, 8, 8))

  const graph = new Graph(end_rects.concat(start_rect))
  graph.key_points = [
    [width / 2, 0],
    [width, 9],
    [width / 2, 18],
    [0, 9]
  ]

  return {
    graph,
    end_offsets: end_points.map<[number, number]>(p => [p[0] - x - width / 2 + 4, p[1] - y + 8])
  }
}

export const Line = (p1 : point, p2 : point) => {
  const line = new Graph('line')
  line.setAttrs({
    x1: p1[0],
    y1: p1[1],
    x2: p2[0],
    y2: p2[1],
    'stroke-width': '4',
    stroke: 'black'
  })
  return line
}

export const LRect = (center : point, width : number, height: number) => {
  const rect = new Graph('rect')
  rect.setAttrs({
    x: center[0],
    y: center[1],
    width,
    height,
    fill: 'red'
  })
  return rect
}

export const Rect = (start : point, width: number, height: number, attrs? : Object) => {
  const rect = new Graph('rect')
  rect.setAttrs(Object.assign({
    x: start[0],
    y: start[1],
    width,
    height,
    fill: 'black'
  }, attrs))
  const horiz_mid = start[0] + width / 2
  const vert_mid = start[1] + height / 2
  rect.key_points = [
    [horiz_mid, start[1]],
    [start[0] + width, vert_mid],
    [horiz_mid, start[1] + height],
    [start[0], vert_mid]
  ]
  return rect
}

export const Arrow = (start : point, direction : direction, factor : number = 4, narrow_factor : number = 0.6) => {
  const arrow = new Graph('path')

  const narrowed_factor = factor * narrow_factor

  const bottom_points = {
    up: () => [[start[0] - narrowed_factor, start[1] - factor], 
         [start[0] + narrowed_factor, start[1] - factor]],
    down: () => [[start[0] - narrowed_factor, start[1] + factor], 
           [start[0] + narrowed_factor, start[1] + factor]],
    left: () => [[start[0] - factor, start[1] + narrowed_factor], 
           [start[0] - factor, start[1] - narrowed_factor]],
    right: () => [[start[0] + factor, start[1] - narrowed_factor], 
            [start[0] + factor, start[1] + narrowed_factor]]
  }[direction]()

  const mid_shift_points = {
    up: () => [start[0], start[1] - narrowed_factor],
    down: () => [start[0], start[1] + narrowed_factor],
    left: () => [start[0] - narrowed_factor, start[1]],
    right: () => [start[0] + narrowed_factor, start[1]]
  }[direction]()

  arrow.setAttrs({
    d: `
      M ${pp(start)}
      L ${pp(bottom_points[0])}
      L ${pp(mid_shift_points)}
      L ${pp(bottom_points[1])}
      Z
    `
  })

  return arrow
}

export const Curve = (start : point, 
                      end : point, 
                      start_direction : direction, 
                      end_direction : direction,
                      factor : number,
                      attrs : Object = {}) => {
  const curve = new Graph('path')
  const [start_str, end_str] = [pp(start), pp(end)]
  const [c_start_str, c_end_str] = [pp(shift(start, start_direction, factor)), pp(shift(end, end_direction, factor))]

  curve.setAttrs(Object.assign({
    d: `
      M ${start_str}
      C ${c_start_str}, ${c_end_str}, ${end_str}
    `,
    stroke: '#aaa',
    fill: 'transparent'
  }, attrs))

  return curve
}

export const CustomCurve = (start : point, 
                      end : point, 
                      cstart : point, 
                      cend : point,
                      attrs : Object = {}) => {
  const curve = new Graph('path')
  const [start_str, end_str] = [pp(start), pp(end)]
  const [c_start_str, c_end_str] = [pp(cstart), pp(cend)]

  curve.setAttrs(Object.assign({
    d: `
      M ${start_str}
      C ${c_start_str}, ${c_end_str}, ${end_str}
    `,
    stroke: '#aaa',
    fill: 'transparent'
  }, attrs))

  return curve
}

export const AutoCurve = (Graph1 : Graph, 
                          Graph2 : Graph, 
                          with_arrow : boolean = false,
                          desc? : string,
                          attrs? : Object) => {
  const shortest = shortest_distance(Graph1.key_points, Graph2.key_points, new Set([0, 2]))
  const direction = ['up', 'right', 'down', 'left']
  
  const start_point = Graph1.key_points[shortest.index1]
  const end_point = Graph2.key_points[shortest.index2]
  const start_direction = direction[shortest.index1]
  const end_direction = direction[shortest.index2]

  let curve = Curve(start_point, end_point, start_direction, end_direction, 16, attrs)
  const k = Math.atan((end_point[1] - start_point[1]) / (end_point[0] - start_point[0])) * 175 / Math.PI
  if (desc) {
    const mid_point = getMidPoint(start_point, end_point)
    const text = Text((end_point[0] < start_point[0] ? 
      [mid_point[0] - 3, mid_point[1]] :
      [mid_point[0] + 3, mid_point[1]]), desc, 0.6)

    text.setAttrs({
      'text-anchor': 'middle',
      transform: `rotate(${k}, ${text.getAttr('x')}, ${text.getAttr('y')})`
    })

    curve = new Graph([curve, text])
  }

  if (!with_arrow)
    return curve
  else {
    const arrow = Arrow(end_point, end_direction)
    return new Graph([curve, arrow])
  }
}

export const Text = (point : point, content : string, size : number = 1) => {
  const text = new Graph('text')
  text.setAttrs({
    x: point[0],
    y: point[1]
  })
  text.setStyles({
    fontSize: size + 'rem'
  })
  text.append(document.createTextNode(content))
  text.key_points = getKeyPoints(text.el)

  return text
}

export const TextBlock = (point : point, contents : Array<string>, font_size : number = 1, with_border : boolean = true) => {
  const text_lst = contents.map((content, index) => {
    return Text([point[0], point[1] + index * font_size * 10], content, font_size)
  })

  const text_block = new Graph(text_lst)

  text_block.key_points = getKeyPoints(text_block.el)

  if (with_border) {
    const top = text_lst[0].key_points[0][1]
    const left = point[0]
    const width = Math.max.apply(null, text_lst.map(x => x.key_points[1][0] - x.key_points[3][0]))
    const height = text_lst[text_lst.length - 1].key_points[2][1] - text_lst[0].key_points[0][1]

    const padding = 10
    const rect = Rect([left - padding, top - padding], width + 2 * padding, height + 2 * padding)
    const combined = new Graph([text_block, rect])
    combined.key_points = rect.key_points
    return combined
  } else 
    return text_block
}