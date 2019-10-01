// @flow

import { rect, curve, auto_curve } from './components'

export class SVGRenderer {
  constructor() {

  }

  render() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 1000 1000')
    const rect1 = rect('20 20', 90, 90)
    const rect2 = rect('200 200', 90, 90)
    const curve1 = auto_curve(rect1, rect2)
    svg.appendChild(rect1.el)
    svg.appendChild(rect2.el)
    svg.appendChild(curve1.el)
    return svg
  }
}