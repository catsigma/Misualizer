// @flow

import { Rect, Arrow, Curve, AutoCurve, Text } from './components'

export class SVGRenderer {
  constructor() {

  }

  render() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 1000 1000')
    const rect1 = Rect([10, 10], 90, 90)
    const rect2 = Rect([250, 100], 30, 90)
    const curve1 = AutoCurve(rect1, rect2, true)
    const text1 = Text([150, 150], 'cxvads')
    const text2 = Text([1, 250], 'dsafdbvsca')
    const curve2 = AutoCurve(text1, text2, true)
    svg.appendChild(rect1.el)
    svg.appendChild(rect2.el)
    svg.appendChild(curve1.el)
    svg.appendChild(text1.el)
    svg.appendChild(text2.el)
    svg.appendChild(curve2.el)
    return svg
  }
}