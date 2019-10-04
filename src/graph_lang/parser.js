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

      return Object.assign({}, node, {kind: 'arrow-node', arrow})
    })

    this.RULE('branch_path_expr', () => {
      this.CONSUME(tokens.LEFT_BRACKET)
      const path = []
      this.AT_LEAST_ONE(() => {
        path.push(this.OR([
          {ALT: () => this.SUBRULE(this.arrow_expr)},
          {ALT: () => this.SUBRULE(this.branch_path_expr)}
        ]))
      })
      this.CONSUME(tokens.RIGHT_BRACKET)
      return {kind: 'branch', path}
    })

    this.RULE('node_expr', () => {
      const name = this.CONSUME(tokens.IDENTIFIER).image
      let paths
      this.OPTION(() => {
        paths = this.SUBRULE(this.path_block_expr)
      })
      return {
        kind: 'node',
        name,
        paths
      }
    })

    this.RULE('path_expr', () => {
      const nodes = []

      nodes.push(this.OR([
        {ALT: () => this.SUBRULE(this.node_expr)},
        {ALT: () => this.SUBRULE(this.contract_expr)}
      ]))

      this.MANY(() => {
        nodes.push(this.OR1([
          {ALT: () => this.SUBRULE(this.arrow_expr)},
          {ALT: () => this.SUBRULE(this.branch_path_expr)}
        ]))
      })

      return nodes
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
        kind: 'contract',
        name,
        paths
      }
    })
  }

  parse(content : string) {
    const lexer = new Lexer(Object.values(tokens))
    this.input = lexer.tokenize(content).tokens
    const output = this.contract_expr()
    if (this.errors.length) {
      this.errors.forEach(error => {
        console.log(`ERROR:\n  ${content.slice(error.previousToken.startOffset - 20, error.token.endOffset + 20)}`)
      })
      throw this.errors
    }
    else
      return output
  }

}