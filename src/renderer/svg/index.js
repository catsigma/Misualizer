// @flow

import { curve } from './components'

export class SVGRenderer {
  constructor() {

  }

  render() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 1000 1000')
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('stroke', 'black')
    path.setAttribute('fill', 'transparent')
    path.setAttribute('d', curve('20 100', '200 200', 'right'))
    svg.appendChild(path)
    return svg
  }
}