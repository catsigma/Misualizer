// @flow

export const reprs = {
  ADD() {
    const [s0, s1] = [this.getStackVal(0), this.getStackVal(1)]
    if (this.isConcrate(0, 1)) {
      return parseInt(s0) + parseInt(s1)
    } else
      return `${s0} + ${s1}`
  }
}



