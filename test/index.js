// @flow

import TBN from 'tezbridge-network/PsBABY5H'

import { GLParser } from '../src/graph_lang'

import { SVGRenderer } from '../src/renderer/svg'

// Init setup
const client = new TBN({
  host: 'https://alphanet-node.tzscan.io'
})

async function main() {
  const contract_info = await client.fetch.contract('KT18brAGvbtX8UGsKTAVex5k63YbZTYNzhpv')

  const code = contract_info.script.code
  console.log(code)
}


function parser() {
  const script = `
    contract test123 {
      N1 -> "N 2" {
        inside1 -> inside2 [
          -i2*1-> i2result_1  
        ] [
          -i2*2-> i2result_2
        ]
        inside3 -> inside4
      } [
        -branch1-> BN1 [
          -bnb1-> BN1Result1
        ] [
          -bnb2-> BN1Result2
        ] [
          -bnb3-> BN1Result3
        ]
      ] [
        -branch2-> BN2
      ]
    }
  `


  const gl_parser = new GLParser()
  return gl_parser.parse(script)
}

function renderer() {
  const graph_tree = parser()

  const renderer = new SVGRenderer()
  const svg = renderer.render(graph_tree)
  const content = document.getElementById('content')

  if (content) {
    content.appendChild(svg)
  }
}

// main()
// parser()
renderer()