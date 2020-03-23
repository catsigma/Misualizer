// @flow

import { Stack } from './stack'
import { instr_mapping } from './instr'

const joint_set = new Set(['IF', 'IF_LEFT', 'IF_NONE', 'IF_CONS', 'LOOP', 'LOOP_LEFT', 'ITER'])
const loop_set = new Set(['LOOP', 'LOOP_LEFT'])

type NodeWithStack = {
  node: Tube | Joint | null,
  stack: Stack
}

export class Valve {
  start : NodeWithStack
  cursors : NodeWithStack[]
  id_mapping: {number: (Tube | Joint)}
  max_id : number
  applied_parts : Set<Object>

  constructor(node : Tube | Joint, id_mapping : {number: (Tube | Joint)}, stack : Stack, max_id : number) {
    this.start = {stack, node}
    this.cursors = [{stack, node}]
    this.id_mapping = id_mapping
    this.max_id = max_id
    this.applied_parts = new Set()
  }

  setStack(stack : Stack) {
    this.start.stack = stack
    this.cursors = [{stack, node: this.start.node}]
  }

  getPaths(node : Tube | Joint) {
    const results = []
    
    const walk = (node : Tube | Joint, prev : number[]) => {
      if (node instanceof Joint &&
          loop_set.has(node.t) &&
          prev.reduce((acc, x) => x === node.id ? acc + 1 : acc, 0) > 2)
        return;

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

  flow() {
    let fails : Stack[] = []
    let ends : Stack[] = []
    const steps = []

    let cursors = this.cursors
    while (cursors.length) {
      const {next_cursors, stack_mem, end_stacks, fail_stacks} = this.flowOnce(cursors)

      ends = ends.concat(end_stacks)
      fails = fails.concat(fail_stacks)

      if (Object.keys(stack_mem).length)
        steps.push(stack_mem)
        
      cursors = next_cursors.filter(({node, stack}) => {
        if (node instanceof Joint &&
            loop_set.has(node.t) &&
            stack.path.reduce((acc, x) => (node && x === node.id) ? acc + 1 : acc, 0) > 1)
          return false
        else
          return true
      })
    }

    return {steps, ends, fails}
  }

  flowOnce(cursors : NodeWithStack[]) : {
    next_cursors : NodeWithStack[],
    stack_mem : {number : Stack[]},
    end_stacks : Stack[],
    fail_stacks : Stack[]
  } {
    let next_cursors : NodeWithStack[] = []
    const stack_mem = {}
    const end_stacks = []
    const fail_stacks = []

    cursors.forEach(cursor => {
      if (!cursor.node)
        return;

      const node = cursor.node
      const result = node.flow(cursor.stack)

      stack_mem[node.id] = (stack_mem[node.id] || []).concat(
        result instanceof Array ? result.map(x => x.stack) : result.stack
      )
      
      const result_lst = (result instanceof Array ? result : [result]).filter(x => {
        if (x.stack.is_failed()) {
          fail_stacks.push(x.stack)
          return false
        } if (!x.node || x.node.id === 0) {
          end_stacks.push(x.stack)
          return false
        } else
          return true
      })

      next_cursors = next_cursors.concat(result_lst)
    })

    return {
      next_cursors,
      stack_mem,
      end_stacks,
      fail_stacks
    }
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

  flow(stack : Stack) : NodeWithStack | NodeWithStack[] {
    let stacks = [stack.clone()]

    this.code.forEach(item => {
      if (item.prim in instr_mapping) {
        if (item.prim === 'EXEC') {
          stacks = stacks.reduce(
            (acc, x) => acc.concat(instr_mapping[item.prim](x, item)), []) 
        } else {
          stacks.forEach(x => instr_mapping[item.prim](x, item))
        }
      }
      else {
        throw `unhandled code instr in Tube: ${item.prim}`
      }
    })

    const retStack = stack => {
      stack.path.push(this.id)
      return {node: this.next, stack}
    }
    return stacks.length === 1 ? 
      retStack(stacks[0]) : 
      stacks.map(stack => retStack(stack))
  }
}

export class Joint {
  id : number
  t : string
  nexts : (Tube | Joint)[]
  parents : number[]

  constructor(id : number, t : string, nexts : (Tube | Joint)[]) {
    this.id = id
    this.t = t
    this.parents = []
    this.nexts = nexts
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

export function codeConvert(code : Object[], init_id? : number) {
  let id = init_id || 1
  const id_mapping = {}

  code = makePlainCode(code)

  const walk = (code : Object[], last? : Tube | Joint) : Tube => {
    const passing_code = []

    for (let i = 0; i < code.length; i++) {
      if (code[i].prim === 'LAMBDA') {
        const lambda_result = codeConvert(code[i].args[2], id + 1)
        const lambda_valve = new Valve(
          lambda_result.tube, lambda_result.id_mapping, new Stack(), lambda_result.id)
        code[i].args[2] = lambda_valve
      }

      if (joint_set.has(code[i].prim)) {
        const remaining = walk(code.slice(i + 1), last)

        const joint = new Joint(id++, code[i].prim, [])
        const joint_child1 = walk(code[i].args[0], loop_set.has(code[i].prim) ? joint : remaining)
        const joint_child2 = code[i].args.length > 1 ? walk(code[i].args[1], remaining) : remaining
        joint.nexts = [joint_child1, joint_child2]
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
    id_mapping,
    id: id - 1
  }
}