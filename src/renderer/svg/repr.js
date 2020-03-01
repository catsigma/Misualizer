// @flow

import { Element } from '../../emu/elem'
import type { EType } from '../../emu/elem'

export type GraphNode = {
  title: string,
  elem: Element,
  children: Array<GraphNode>,
  direction?: 'left' | 'right',
  style?: Object
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

    // const title = readT(elem.subs[0].t, true) === 'list<operation>' ? `RESULT -> (${mixed_children.join(', ')})` : `(${mixed_children.join(', ')})`
    const title = `(${mixed_children.join(', ')})`

    return {
      title,
      elem,
      children
    }
  }
}

const getDirectionByOptionType = (elem : Element) => {
  if (elem.subs.length)
    return elem.subs[0].instr === 'None' 

  return undefined
}
const getDirectionByOrType = (elem : Element) => {
  const confirmed = new Set(['Left', 'Right']).has(elem.instr)
  return confirmed ? elem.instr.toLowerCase() : undefined
}

const getDirectionByBoolType = (elem : Element) => {
  if (elem.subs.length && elem.subs[0].instr === 'COMPARE') {
    return getDirectionByCompare(elem)
  }
  else
    return undefined
}

const getDirectionByCompare = (elem : Element) => {
  const default_set = new Set(['SELF', 'NOW', 'SOURCE', 'SENDER', 'CHAIN_ID', 'AMOUNT', 'BALANCE'])
  const ignore_wrapper_set = new Set(['ADDRESS', 'IMPLICIT_ACCOUNT'])
  
  const getInsideSub = (el : Element) => {
    if (ignore_wrapper_set.has(el.instr))
      return getInsideSub(el.subs[0])

    return el
  }
  const safeFloat = (a, b) => {
    a = parseFloat(a)
    b = parseFloat(b)
    return isNaN(a) || isNaN(b) ? [] : [a, b]
  }
  const mapping = {
    numBase: (l, r, fn) => {
      const nums = safeFloat(l, r)
      return nums.length ? fn(nums[0], nums[1]) : undefined
    },
    EQ: (l, r) => l === r,
    NEQ: (l, r) => l !== r,
    LE: (l, r) => mapping.numBase(l, r, (a, b) => a <= b),
    LT: (l, r) => mapping.numBase(l, r, (a, b) => a < b),
    GE: (l, r) => mapping.numBase(l, r, (a, b) => a >= b),
    GT: (l, r) => mapping.numBase(l, r, (a, b) => a > b)
  }
  const left = genText(getInsideSub(elem.subs[0].subs[0]))
  const right = genText(getInsideSub(elem.subs[0].subs[1]))

  if (default_set.has(left) || default_set.has(right))
    return undefined

  if (elem.instr in mapping) {
    const result = mapping[elem.instr](left, right)
    return result === undefined ? result : result ? 'left' : 'right'
  } else {
    debugger
    throw `invalid comparing method: ${elem.instr}`
  }
}

const instr2GraphNode = {
  COND_TRUE(elem : Element) {
    const direction = getDirectionByBoolType(elem.subs[0])
    return {
      title: `{${genText(elem.subs[0])}} is True`,
      elem,
      direction,
      children: []
    }
  },
  COND_FALSE(elem : Element) {
    const direction = getDirectionByBoolType(elem.subs[0])
    return {
      title: `{${genText(elem.subs[0])}} is False`,
      elem,
      direction,
      children: []
    }
  },
  COND_LEFT(elem : Element) {
    const direction = getDirectionByOrType(elem.subs[0])
    return {
      title: `{${genText(elem.subs[0])}} is Left`,
      elem,
      direction,
      children: []
    }
  },
  COND_RIGHT(elem : Element) {
    const direction = getDirectionByOrType(elem.subs[0])
    return {
      title: `{${genText(elem.subs[0])}} is Right`,
      elem,
      direction,
      children: []
    }
  },
  COND_ITEM(elem : Element) {
    return {
      title: `{${genText(elem.subs[0])}} has item`,
      elem,
      children: []
    }
  },
  COND_EMPTY(elem : Element) {
    return {
      title: `{${genText(elem.subs[0])}} is empty`,
      elem,
      children: []
    }
  },
  COND_NONE(elem : Element) {
    const direction = getDirectionByOptionType(elem.subs[0])
    return {
      title: `{${genText(elem.subs[0])}} is None`,
      elem,
      direction,
      children: []
    }
  },
  COND_SOME(elem : Element) {
    const direction = getDirectionByOptionType(elem.subs[0])
    return {
      title: `{${genText(elem.subs[0])}} is Some`,
      elem,
      direction,
      children: []
    }
  },
  IF_LEFT(elem : Element) {
    const cond = elem.subs[0]
    const cond_txt = genText(cond)
    const direction = getDirectionByOrType(cond)

    return {
      title: direction ? `{${cond_txt}} is ${cond.instr}` : `if {${cond_txt}} is Left`,
      elem,
      direction,
      children: elem.subs.slice(1).map<GraphNode>(x => genGraphNode(x))
    }
  },
  IF(elem : Element) {
    const cond = elem.subs[0]
    const cond_txt = genText(cond)
    const direction = getDirectionByBoolType(cond)

    return {
      title: direction ? 
        `${cond_txt} is ${direction === 'left' ? 'True' : 'False'}` : 
        `if {${cond_txt}}`,
      elem,
      direction,
      children: elem.subs.slice(1).map<GraphNode>(x => genGraphNode(x))
    }
  },
  IF_NONE(elem : Element) {
    const cond = elem.subs[0]
    const cond_txt = genText(cond)
    const direction = getDirectionByOptionType(cond)

    return {
      title: direction !== undefined ? 
        `{${cond_txt}} is ${direction ? 'None' : 'Some'}` :
        `if {${cond_txt}} is None`,
      elem,
      direction,
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
    return `${genText(elem.subs[0].subs[0])} == ${genText(elem.subs[0].subs[1])}`
  },
  NEQ(elem : Element) {
    return `${genText(elem.subs[0].subs[0])} != ${genText(elem.subs[0].subs[1])}`
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
export function readT(t : EType | string, deep : boolean = false) {
  if (t instanceof Array) {
    if (deep_set.has(t[0]) || deep) {
      return t[0].toString() + 
         (t.length === 1 ? '' : `<${t.slice(1).map(x => readT(x, true)).join(', ')}>`)
    } else 
      return t[0].toString()
  } else 
    return t
}

export function readElem(elem : Element, deep : boolean = false) {
  if (typeof elem.value === 'string' && elem.value.length)
    return elem.value

  if (elem.annots.length) {
    return elem.annots[0] + ':' + readT(elem.t, deep)
  } else {
    return elem.instr || readT(elem.t, deep)
  }
}