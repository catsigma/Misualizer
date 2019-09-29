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

function shift(point : point, direction : direction) : point {
  point = normalizePoint(point)
  const factor = 30
  const shift_mapping = {
    up: [0, -factor],
    down: [0, factor],
    left: [-factor, 0],
    right: [factor, 0]
  }

  const shift_point = shift_mapping[direction]
  return [point[0] + shift_point[0], point[1] + shift_point[1]]
}

// =============== BASIC GRAPHS COMPONENTS ===============
export const curve = (start : point, end : point, direction : direction) => {
  const [start_str, end_str] = [pp(start), pp(end)]
  const c_start_str = pp(shift(start, direction))
  const [mid_x, mid_y] = getMidPoint(start, end)

  return `
    M ${start_str}
    Q ${c_start_str}, ${mid_x} ${mid_y} T ${end_str}
  `
}