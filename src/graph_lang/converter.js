// @flow

function stringify(x : Object) {
  const str = JSON.stringify(x)
  return `"${str.replace(/"/g, '')}"`
}
const inside_set = new Set([
  'PUSH'  
])

export function JSON2GL(contract : string, input : Object) {
  const result = ['contract']

  const walk = (node : Object, not_first : boolean) => {
    if (not_first)
      result.push('->')

    if (!node.args || inside_set.has(node.prim)) {

      result.push(stringify(node))

    } else if (node.args.length === 1) {

      result.push(node.prim)
      result.push('{')
      if (node.args[0] instanceof Array) {
        node.args[0].forEach((node, i) => {
          walk(node, i)
        })
      } else {
        result.push(stringify(node.args[0]))
      }
      result.push('}')

    } else {

      result.push(node.prim)
      node.args.forEach(arg => {
        if (arg instanceof Array) {
          if (arg.length > 0) {
            result.push('[')
            arg.forEach(node => {
              walk(node, true)
            })
            result.push(']')
          }
        } else {
          result.push('[')
          result.push('->')
          result.push(stringify(arg))
          result.push(']')
        }
      })
    }
  }

  input.prim = contract
  walk(input, false)

  return result
}

export function Mock2GL(input : Object, title : string) {
  const result = ['contract', title, '{']

  const walk = (node : Object, not_first : boolean) => {
    if (not_first)
      result.push('->')

    if (node.value instanceof Array) {
      result.push(node.kind)
      node.value.forEach(item => {
        result.push('[')
        walk(item, true)
        result.push(']')
      })
    } else {
      result.push(node.value)
    }
  }

  walk(input, false)

  result.push('}')
  return result
}
