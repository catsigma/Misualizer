// @flow

import { Stack } from './stack'

export class Tube {
  id : number
  code : Object[]
  next : Tube | Joint | null

  constructor(id : number, code : Object[], next? : Tube | Joint | null = null) {
    this.id = id
    this.code = code
    this.next = next
  }

  flow(stack : Stack) : Stack {
    return stack
  }
}

const joint_set = new Set(['IF', 'IF_LEFT'])
export class Joint {
  id : number
  t : string
  nexts : (Tube | Joint)[]

  constructor(id : number, t : string, nexts : (Tube | Joint)[]) {
    this.id = id
    this.t = t
    this.nexts = nexts
  }

  flow(stack : Stack) : Stack[] {
    return [stack, stack]
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

    } else if (item.prim && item.args) {
      item.args = item.args.map(x => makePlainCode(x))
      result.push(item)

    } else
      result.push(item)

  })

  return result
}

export function codeConvert(code : Object[]) : Tube {
  let id = 1

  code = makePlainCode(code)

  const walk = (code : Object[], last? : Tube) => {
    const passing_code = []

    for (let i = 0; i < code.length; i++) {
      if (joint_set.has(code[i].prim)) {
        const remaining = walk(code.slice(i + 1), last)
        return new Tube(id++, passing_code, new Joint(
          id++, code[i].prim, [walk(code[i].args[0], remaining), walk(code[i].args[1], remaining)]
        ))
      }
      
      passing_code.push(code[i])
    }

    return new Tube(id++, passing_code, last)
  }

  return walk(code)
}