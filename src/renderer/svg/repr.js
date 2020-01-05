// @flow

import { Element } from '../../emu/elem'
import type { EType } from '../../emu/elem'

export type GraphNode = {
  title: string,
  elem: Element,
  children: Array<GraphNode>
}

function graphNodeMix(subs : Array<Element>, children : Array<GraphNode>) {
  return subs.map<string>((x, i) => {
    const node = genGraphNode(x)
    if (node.children.length) {
      children.push(node)
      return `#${i}`
    } else
      return node.title
  })
}

const t2GraphNode = {
  pair(elem : Element) {
    const children : Array<GraphNode> = []
    const mixed_children = graphNodeMix(elem.subs, children)

    const title = readT(elem.subs[0].t, true) === 'list<operation>' ? `RESULT(${mixed_children.join(', ')})` : `(${mixed_children.join(', ')})`

    return {
      title,
      elem,
      children
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
  IF_NONE(elem : Element) {
    return {
      title: `if {${genText(elem.subs[0])}} is None`,
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
  },
  ADD(elem : Element) {
    const children : Array<GraphNode> = []
    const mixed_children = graphNodeMix(elem.subs, children)

    return {
      title: `(${mixed_children[0]} + ${mixed_children[1]})`,
      elem,
      children
    }
  },
  EDIV(elem : Element) {
    const children : Array<GraphNode> = []
    const mixed_children = graphNodeMix(elem.subs, children)

    return {
      title: `${mixed_children[0]} / ${mixed_children[1]}`,
      elem,
      children
    }
  },
  MUL(elem : Element) {
    const children : Array<GraphNode> = []
    const mixed_children = graphNodeMix(elem.subs, children)

    return {
      title: `${mixed_children[0]} * ${mixed_children[1]}`,
      elem,
      children
    }
  }
}

const t2Text = {

}
const instr2Text = {
  LT(elem : Element) {
    return `${genText(elem.subs[0].subs[0])} < ${genText(elem.subs[0].subs[1])}`
  },
  GT(elem : Element) {
    return `${genText(elem.subs[0].subs[0])} > ${genText(elem.subs[0].subs[1])}`
  },
  LE(elem : Element) {
    return `${genText(elem.subs[0].subs[0])} <= ${genText(elem.subs[0].subs[1])}`
  },
  GE(elem : Element) {
    return `${genText(elem.subs[0].subs[0])} >= ${genText(elem.subs[0].subs[1])}`
  },
  EQ(elem : Element) {
    return `${genText(elem.subs[0].subs[0])} == 0`
  },
  NEQ(elem : Element) {
    return `${genText(elem.subs[0].subs[0])} != 0`
  },
  MUL(elem : Element) {
    return `${genText(elem.subs[0])} * ${genText(elem.subs[1])}`
  },
  ADD(elem : Element) {
    return `(${genText(elem.subs[0])} + ${genText(elem.subs[1])})`
  },
  EDIV(elem : Element) {
    return `${genText(elem.subs[0])} / ${genText(elem.subs[1])}`
  }
}

export function genText(elem : Element) : string {
  const t = elem.t[0].toString()

  if (elem.instr in instr2Text)
    return instr2Text[elem.instr](elem)

  if (t in t2Text)
    return t2Text[t](elem)

  if (elem.subs.length && !elem.annots.length)
    return `${elem.instr}(${elem.subs.map(x => genText(x)).join(', ')})`
  else
    return readElem(elem)
}

function graphNode2Text(node : GraphNode) : string {
  let result = node.title
  node.children.forEach((child, i) => {
    result = result.replace(`#${i}`, graphNode2Text(child))
  })
  return result
}

export function genGraphNode(elem : Element) : GraphNode {
  const t = elem.t[0].toString()

  if (elem.instr in instr2GraphNode)
    return instr2GraphNode[elem.instr](elem)

  if (!elem.instr && t in t2GraphNode)
    return t2GraphNode[t](elem)

  if (elem.subs.length) {
    const children : Array<GraphNode> = []
    const mixed_children = graphNodeMix(elem.subs, children)

    return {
      title: `${elem.instr}(${mixed_children.join(', ')})`,
      elem,
      children
    }
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

function readElem(elem : Element, deep : boolean = false) {
  if (elem.annots.length) {
    return elem.annots[0] + ':' + readT(elem.t, deep)
  } else {
    return elem.instr || elem.value || readT(elem.t, deep)
  }
}