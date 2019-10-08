// @flow

import TBN from 'tezbridge-network/PsBabyM1'

import { GLParser, JSON2GLConvert, Mock2GLConvert } from '../src/graph_lang'

import { SVGRenderer } from '../src/renderer/svg'

import { Contract } from '../src/emu'

// Init setup
const client = new TBN({
  host: 'https://babylonnet-node.tzscan.io'
})


function parser() {
  const script = `
    contract test123 {
      N1 { x } -> "N 2" {
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

function renderer(graph? : Object) {
  const graph_tree = parser()

  const renderer = new SVGRenderer()
  const svg = renderer.render(graph || graph_tree, 1000, 100000)
  const content = document.getElementById('content')

  if (content) {
    content.appendChild(svg)
  }
}

async function main() {
  // const address = 'KT1EwTPTEUWbpLBJiNs34VkMqpmpxPjpCQEt'
  const address = 'KT1KBLcPM6BzovBfRjXKd7xVHkXairC1heSh'

  const contract_info = await client.fetch.contract(address)

//   const code = contract_info.script.code
//   const graph_arr = JSON2GLConvert(contract, code[2])
//   const graph_str = graph_arr.join(' ')
// 
//   const gl_parser = new GLParser()
//   const graph = gl_parser.parse(graph_str)
//   renderer(graph)

  const contract = new Contract(contract_info)
  // console.log(contract)
  // contract.parseCode()
  const parameter = contract.getMockFromType(contract.parameter_t[0])

  const graph_arr = Mock2GLConvert(parameter, 'parameter')
  const graph_str = graph_arr.join(' ')

  const gl_parser = new GLParser()
  const graph = gl_parser.parse(graph_str)
  
  const renderer = new SVGRenderer()
  const svg = renderer.renderMockData(graph)
  const content = document.getElementById('content')

  if (content) {
    content.appendChild(svg)
  }
}

main()
// parser()
// renderer()
