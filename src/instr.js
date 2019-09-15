// @flow

export class Instr {
  name : string
  raw_type : string

  // for graph
  annotation : string
  slots : {
    input: {[string]: string},
    output: {[string]: string}
  }

  // for vm
  parameters : Array<Instr>
  action : (Array<Instr>) => void

  constructor() {

  }
}
