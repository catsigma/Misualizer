// @flow

import { Stack } from './stack'
import { instr_mapping } from './instr'

type NodeWithStack = {
  node: Tube | Joint | null,
  stack: Stack
}

export class Valve {
  start : NodeWithStack
  cursors : NodeWithStack[]
  stack_mem : {number: Stack[]}
  id_mapping: {number: (Tube | Joint)}

  constructor(node : Tube | Joint, id_mapping : {number: (Tube | Joint)}, stack : Stack) {
    this.start = {stack, node}
    this.cursors = [{stack, node}]
    this.stack_mem = {}
    this.id_mapping = id_mapping
  }

  addToStackMem(node : Tube | Joint | null, result : Stack | Stack[]) {
    if (!node)
      return;

    if (!(node.id in this.stack_mem))
      this.stack_mem[node.id] = []

    this.stack_mem[node.id] = this.stack_mem[node.id].concat(result)
  }

  getPaths(node : Tube | Joint) {
    const results = []
    
    const walk = (node : Tube | Joint, prev : number[]) => {
      if (node.parents.length) {
        node.parents.forEach(parent_id => {
          const cloned = prev.slice()
          cloned.unshift(parent_id)
          walk(this.id_mapping[parent_id], cloned)
        })
      } else {
        results.push(prev)
      }
    }

    walk(node, [node.id])
    return results
  }

  flowByPath(path : number[]) {
    const ret = {}

    let stack = this.start.stack
    path.forEach((node_id, index) => {
      const node = this.id_mapping[node_id]
      const result = node.flow(stack, path[index + 1])
      ret[node.id] = result instanceof Array ? result.map(x => x.stack) : result.stack
      stack = result.stack
    })

    return ret
  }

  flowOnce() {
    let next_cursors = []

    this.cursors.forEach(cursor => {
      if (!cursor.node)
        return;

      const result = cursor.node.flow(cursor.stack)
      this.addToStackMem(cursor.node, result instanceof Array ? result.map(x => x.stack) : result.stack)
      next_cursors = next_cursors.concat(result)
    })

    this.cursors = next_cursors.filter(x => !x.stack.is_failed())
    return !!this.cursors.length
  }
}

export class Tube {
  id : number
  code : Object[]
  next : Tube | Joint | null
  parents : number[]

  constructor(id : number, code : Object[], next? : Tube | Joint | null = null, parent? : number) {
    this.id = id
    this.code = code
    this.next = next
    this.parents = parent ? [parent] : []
  }

  addParent(id : number) {
    this.parents.push(id)
  }

  flow(stack : Stack) : NodeWithStack {
    stack = stack.clone()

    this.code.forEach(item => {
      if (item.prim in instr_mapping)
        instr_mapping[item.prim](stack, item)
      else {
        throw `unhandled code instr in Tube: ${item.prim}`
      }
    })

    stack.path.push(this.id)
    return {
      node: this.next,
      stack
    }
  }
}

const joint_set = new Set(['IF', 'IF_LEFT', 'IF_NONE', 'IF_CONS', 'LOOP', 'LOOP_LEFT', 'ITER'])
export class Joint {
  id : number
  t : string
  nexts : (Tube | Joint)[]
  parents : number[]

  constructor(id : number, t : string, nexts : (Tube | Joint)[]) {
    this.id = id
    this.t = t
    this.nexts = nexts
    this.parents = []
  }

  addParent(id : number) {
    this.parents.push(id)
  }

  flow(stack : Stack, next_id? : number) : NodeWithStack | NodeWithStack[] {
    stack = stack.clone()

    if (this.t in instr_mapping) {
      const stacks = instr_mapping[this.t](stack)
      const result = stacks.map((stack, i) => {
        stack.path.push(this.id)
        return {
          node: this.nexts[i],
          stack
        }
      })

      return next_id ? result.find(x => next_id === x.node.id) : result 
    }
    else {
      throw `unhandled code instr in Joint: ${this.t}`
    }
  }
}

export function makePlainCode(code : Object[]) {
  if (!(code instanceof Array))
    return code

  const result = []
    
  code.forEach(item => {
    if (item instanceof Array) {
      const plain_item = makePlainCode(item)
      plain_item.forEach(x => result.push(x))

    } else if (item.prim === 'DIP') {
      const level = item.args[0].int ? item.args.shift().int : '1'
      result.push({prim: 'CURSOR', args: [{int: level}]})
      makePlainCode(item.args[0]).forEach(x => result.push(x))
      result.push({prim: 'CURSOR', args: [{int: '-' + level}]})

    } else if (item.prim && item.args) {
      item.args = item.args.map(x => makePlainCode(x))
      result.push(item)

    } else
      result.push(item)

  })

  return result
}

export function codeConvert(code : Object[]) {
  let id = 1
  const id_mapping = {}

  code = makePlainCode(code)

  const walk = (code : Object[], last? : Tube) : Tube => {
    const passing_code = []

    for (let i = 0; i < code.length; i++) {
      if (joint_set.has(code[i].prim)) {
        const remaining = walk(code.slice(i + 1), last)

        const joint_child1 = walk(code[i].args[0], remaining)
        const joint_child2 = code[i].args.length > 1 ? walk(code[i].args[1], remaining) : remaining
        const joint = new Joint(id++, code[i].prim, [joint_child1, joint_child2])
        id_mapping[joint.id] = joint
        joint_child1.addParent(joint.id)
        joint_child2.addParent(joint.id)

        const tube = new Tube(id++, passing_code, joint)
        id_mapping[tube.id] = tube
        joint.addParent(tube.id)

        return tube
      }
      
      passing_code.push(code[i])
    }

    if (!passing_code.length && !last)
      return new Tube(0, [])
    else {
      last = 
        (passing_code.length && passing_code[passing_code.length - 1].prim === 'FAILWITH') ? 
        undefined : 
        last

      const result = new Tube(id++, passing_code, last)
      id_mapping[result.id] = result
      last && last.addParent(result.id)
      return result
    }
  }

  return {
    tube: walk(code),
    id_mapping
  }
}