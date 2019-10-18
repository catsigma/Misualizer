// @flow

import TBN from 'tezbridge-network/PsBabyM1'

import { GLParser, JSON2GLConvert, Mock2GLConvert, Code2GLConvert } from '../src/graph_lang'

import { SVGRenderer } from '../src/renderer/svg'

import { Contract } from '../src/emu'

// Init setup
const client = new TBN({
  host: 'https://mainnet.tezrpc.me'
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
  const address = 'KT1Mfe3rRhQw9KnEUZzoxkhmyHXBeN3zCzXL'
  // const address = 'KT1KBLcPM6BzovBfRjXKd7xVHkXairC1heSh'

  const contract_info = await client.fetch.contract(address)

//   const code = contract_info.script.code
//   const graph_arr = JSON2GLConvert(contract, code[2])
//   const graph_str = graph_arr.join(' ')
// 
//   const gl_parser = new GLParser()
//   const graph = gl_parser.parse(graph_str)
//   renderer(graph)

  const contract = new Contract(contract_info)
  console.log('code', contract.code[0])
  const {graph_tree, node_mapping} = contract.parseCode()
  
  const parameter = contract.stack[0].children[0]
  const parameter_graph_arr = Mock2GLConvert(parameter, 'parameter')
  const parameter_graph_str = parameter_graph_arr.join(' ')

  const storage = contract.stack[0].children[1]
  const storage_graph_arr = Mock2GLConvert(storage, 'storage')
  const storage_graph_str = storage_graph_arr.join(' ')

  const graph_arr = Code2GLConvert(graph_tree, address)
  const graph_str = graph_arr.join(' ')
  

  const gl_parser1 = new GLParser()
  const graph_code = gl_parser1.parse(graph_str)
  const gl_parser2 = new GLParser()
  const graph_parameter = gl_parser2.parse(parameter_graph_str)
  const gl_parser3 = new GLParser()
  const graph_storage = gl_parser2.parse(storage_graph_str)

  const renderer = new SVGRenderer()
  const svg = renderer.renderCode(graph_code, node_mapping, graph_parameter, graph_storage)
  const content = document.getElementById('content')

  if (content) {
    content.appendChild(svg)
  }
}

main()
// parser()
// renderer()
