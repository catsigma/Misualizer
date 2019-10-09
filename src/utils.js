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