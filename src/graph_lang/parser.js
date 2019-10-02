// @flow

import { Lexer, EmbeddedActionsParser } from 'chevrotain'
import { tokens } from './lexer'

export class Parser extends EmbeddedActionsParser {
  constructor() {
    super(Object.values(tokens))

    this.setRules()
    this.performSelfAnalysis()
  }

  setRules() {

    this.RULE('arrow_expr', () => {
      const arrow = this.CONSUME(tokens.ARROW_RIGHT).image.replace(/-|>/g, '')
      const node = this.OR([
        {ALT: () => this.SUBRULE(this.node_expr)},
        {ALT: () => this.SUBRULE(this.contract_expr)}
      ])

      return {arrow, node}
    })

    this.RULE('branch_path_expr', () => {
      this.CONSUME(tokens.LEFT_BRACKET)
      const paths = []
      this.AT_LEAST_ONE(() => {
        paths.push(this.OR([
          {ALT: () => this.SUBRULE(this.arrow_expr)},
          {ALT: () => this.SUBRULE(this.branch_path_expr)}
        ]))
      })
      this.CONSUME(tokens.RIGHT_BRACKET)
      return paths
    })

    this.RULE('node_expr', () => {
      const name = this.CONSUME(tokens.IDENTIFIER).image
      let inside
      this.OPTION(() => {
        inside = this.SUBRULE(this.path_block_expr)
      })
      return {
        name,
        inside
      }
    })

    this.RULE('path_expr', () => {
      const start_node = this.OR([
        {ALT: () => this.SUBRULE(this.node_expr)},
        {ALT: () => this.SUBRULE(this.contract_expr)}
      ])
      const nodes = []
      this.AT_LEAST_ONE(() => {
        nodes.push(this.OR1([
          {ALT: () => this.SUBRULE(this.arrow_expr)},
          {ALT: () => this.SUBRULE(this.branch_path_expr)}
        ]))
      })

      return {
        start_node,
        nodes
      }
    })

    this.RULE('path_block_expr', () => {
      const paths = []
      this.CONSUME(tokens.LEFT_CURLY_BRACKET)
      this.MANY(() => {
        paths.push(this.SUBRULE(this.path_expr))
      })
      this.CONSUME(tokens.RIGHT_CURLY_BRACKET)
      return paths
    })

    this.RULE('contract_expr', () => {
      this.CONSUME(tokens.CONTRACT)
      const name = this.CONSUME(tokens.IDENTIFIER).image
      const paths = this.SUBRULE(this.path_block_expr)

      return {
        contract: name,
        paths
      }
    })
  }

  parse(content : string) {
    const lexer = new Lexer(Object.values(tokens))
    this.input = lexer.tokenize(content).tokens
    const output = this.contract_expr()
    if (this.errors.length)
      throw this.errors
    else
      return output
  }

}