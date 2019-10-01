// @flow

import { Rect, Arrow, Curve, AutoCurve } from './components'

export class SVGRenderer {
  constructor() {

  }

  render() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 1000 1000')
    const rect1 = Rect('0 0', 90, 90)
    const rect2 = Rect('250 100', 90, 90)
    const curve1 = AutoCurve(rect1, rect2, true)
    svg.appendChild(rect1.el)
    svg.appendChild(rect2.el)
    svg.appendChild(curve1.el)
    return svg
  }
}