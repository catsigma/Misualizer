// @flow

export type point = string | [number, number]
export type direction = 'up' | 'down' | 'left' | 'right'

function normalizePoint(point : point) : [number, number] {
  if (point instanceof Array) {
    if (point.length !== 2)
      throw `invalid svg point: ${point.toString()}`

    return point
  }

  const point_lst = point.split(/\s+/)
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

function getMidPoint(point1 : point, point2 : point) {
  const p1 = normalizePoint(point1)
  const p2 = normalizePoint(point2)

  return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]
}

function pp(point : point) {
  // print point
  return point instanceof Array ? `${point[0]} ${point[1]}` : point
}

function shift(point : point, direction : direction, factor : number = 50) : point {
  point = normalizePoint(point)
  const shift_mapping = {
    up: [0, -factor],
    down: [0, factor],
    left: [-factor, 0],
    right: [factor, 0]
  }

  const shift_point = shift_mapping[direction]
  return [point[0] + shift_point[0], point[1] + shift_point[1]]
}

function distance(point1 : point, point2 : point, with_sqrt : boolean = true) {
  const square_sum = Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[1], 2)
  return with_sqrt ? Math.sqrt(square_sum) : square_sum
}

function shortest_distance(point_lst1 : Array<point>, point_lst2 : Array<point>) {
  let last_d = Number.MAX_SAFE_INTEGER
  let result_index = []
  point_lst1.forEach((point1, index1) => {
    point_lst2.forEach((point2, index2) => {
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

// =============== BASIC GRAPHS COMPONENTS ===============
class Component {
  kind : string
  key_points : Array<point>
  el : Element

  constructor(init_info : string | Array<Component>) {
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
}

export const Rect = (start : point, width: number, height: number) => {
  const rect = new Component('rect')
  const start_point = normalizePoint(start)
  rect.setAttrs({
    x: start_point[0],
    y: start_point[1],
    width,
    height
  })
  const horiz_mid = start_point[0] + width / 2
  const vert_mid = start_point[1] + height / 2
  rect.key_points = [
    [horiz_mid, start_point[1]],
    [start_point[0] + width, vert_mid],
    [horiz_mid, start_point[1] + height],
    [start_point[0], vert_mid]
  ]
  return rect
}

export const Arrow = (start : point, direction : direction, factor : number = 10, narrow_factor : number = 0.6) => {
  start = normalizePoint(start)

  const arrow = new Component('path')

  const narrowed_factor = factor * narrow_factor

  const bottom_points = {
    up: () => [[start[0] - narrowed_factor, start[1] - factor], 
         [start[0] + narrowed_factor, start[1] - factor]],
    down: () => [[start[0] - narrowed_factor, start[1] - factor], 
           [start[0] + narrowed_factor, start[1] - factor]],
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
                      factor : number) => {
  const curve = new Component('path')
  const [start_str, end_str] = [pp(start), pp(end)]
  const [c_start_str, c_end_str] = [pp(shift(start, start_direction, factor)), pp(shift(end, end_direction, factor))]

  curve.setAttrs({
    d: `
      M ${start_str}
      C ${c_start_str}, ${c_end_str}, ${end_str}
    `,
    stroke: 'red',
    fill: 'transparent'
  })

  return curve
}

export const AutoCurve = (component1 : Component, component2 : Component, with_arrow : boolean = false) => {
  const shortest = shortest_distance(component1.key_points, component2.key_points)
  const direction = ['up', 'right', 'down', 'left']
  
  const start_point = component1.key_points[shortest.index1]
  const end_point = component2.key_points[shortest.index2]
  const start_direction = direction[shortest.index1]
  const end_direction = direction[shortest.index2]

  const curve = Curve(start_point, end_point, start_direction, end_direction, 100)
  if (!with_arrow)
    return curve
  else {
    const arrow = Arrow(end_point, end_direction)
    return new Component([curve, arrow])
  }
}