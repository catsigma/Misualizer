// @flow

import { Element } from '../../emu/elem'
import type { EType } from '../../emu/elem'

export type GraphNode = {
  title: string,
  elem: Element,
  children: Array<GraphNode>
}

const t2GraphNode = {
  pair(elem : Element) {
    const title = readT(elem.subs[0].t, true) === 'list<operation>' ? 'RESULT' : '()'
      
    return {
      title,
      elem,
      children: elem.subs.map<GraphNode>(x => genGraphNode(x))
    }
  }
}
const instr2GraphNode = {
  IF_LEFT(elem : Element) {
    return {
      title: `if {${genText(elem.subs[0])}} is Left`,
      elem,
      children: elem.subs.slice(1).map<GraphNode>(x => genGraphNode(x))
    }
  },
  IF(elem : Element) {
    return {
      title: `if {${genText(elem.subs[0])}}`,
      elem,
      children: elem.subs.slice(1).map<GraphNode>(x => genGraphNode(x))
    }
  },
  EXEC(elem : Element) {
    return {
      title: `${genText(elem.subs[1])}(${genText(elem.subs[0])})`,
      elem,
      children: []
    }
  },
  NIL(elem : Element) {
    return {
      title: '[]',
      elem,
      children: []
    }
  },
  CONS(elem : Element) {
    const left = genGraphNode(elem.subs[0])
    const right = genGraphNode(elem.subs[1])

    if (elem.subs[1].instr === 'NIL') {
      left.title = `[${left.title}]`
      return left
    }

    return {
      title: '+',
      elem,
      children: [left, right]
    }
  }
}

const t2Text = {

}
const instr2Text = {
  LT(elem : Element) {
    return `${genText(elem.subs[0].subs[0])} < ${genText(elem.subs[0].subs[1])}`
  }
}

export function genText(elem : Element) : string {
  const t = elem.t[0].toString()

  if (elem.instr in instr2Text)
    return instr2Text[elem.instr](elem)

  if (t in t2Text)
    return t2Text[t](elem)

  // if (elem.subs.length)
  //   return `${elem.instr}(${elem.subs.map(x => genText(x)).join(', ')})`
  // else
    return readElem(elem)
}

export function genGraphNode(elem : Element) : GraphNode {
  const t = elem.t[0].toString()

  if (elem.instr in instr2GraphNode)
    return instr2GraphNode[elem.instr](elem)

  if (t in t2GraphNode)
    return t2GraphNode[t](elem)

  if (elem.subs.length)
    return {
      title: elem.instr,
      elem,
      children:  elem.subs.map<GraphNode>(x => genGraphNode(x))
    }
  else
    return {
      title: readElem(elem),
      elem,
      children: []
    }
}

const deep_set = new Set(['option', 'contract'])
function readT(t : EType | string, deep : boolean = false) {
  if (t instanceof Array) {
    if (deep_set.has(t[0]) || deep) {
      return t[0].toString() + 
         (t.length === 1 ? '' : `<${t.slice(1).map(x => readT(x, true)).join(', ')}>`)
    } else 
      return t[0].toString()
  } else 
    return t
}

function readElem(elem : Element) {
  if (elem.annots.length) {
    return elem.annots[0] + ':' + readT(elem.t)
  } else {
    return elem.instr || readT(elem.t)
  }
}