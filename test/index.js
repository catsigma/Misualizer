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
    contract abc123 {
      "if x > 2" {
        aaa -> bbb
      } [
        -yes-> "the yes result" -> ppp [-ppp1-> dvas] [-ppp2-> qcvzxv]
      ] [
        -no-> "the no result"
        -> contract qqq {
          eeeee -> wwwww -> zzzzz
          vwef -> fe
        } -> "AA BB"
      ] [
        -don't know-> "don't know"
      ]
    }
  `

  const gl_parser = new GLParser()
  return gl_parser.parse(script)
}

function renderer() {
  const graph_tree = parser()
  console.log(graph_tree)
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