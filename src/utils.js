// @flow

export function throttle(fn : Function) {
  let last_trigger = +new Date
  return function(){
    const now = +new Date
    if (now > last_trigger + 1000 / 60) {
      last_trigger = now
      return fn.apply(this, arguments)
    }
  }
}

export function getQuery(name : string) {
  const search_arr = location.hash.slice(1).split('&').map(x => x.split('='))

  const mapping = {}
  search_arr.forEach(x => mapping[x[0]] = x[1])

  return mapping[name]
}