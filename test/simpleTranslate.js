'use strict'

/* eslint-env mocha */

const assert = require('assert')

const testCases = [ // out lang is 'de' (german), use gtranslate if you don't know it
  {
    in: '<h2><translate>World</translate></h2>',
    translate: 'World',
    translated: 'Welt',
    out: '<h2>Welt</h2>'
  },
  {
    in: '<h2><translate>Hello <b>World</b></translate></h2>',
    translate: 'Hello æWorldæ',
    translated: 'Hallo æWeltæ',
    out: '<h2>Hallo <b>Welt</b></h2>'
  }
]

const {getTrObjects, applyTr} = require('../src/utils')

const parser = require('posthtml-parser')
const render = require('posthtml-render')

describe('simple translate test', () => {
  testCases.forEach((c, i) => {
    describe(`case ${i}`, () => {
      let ast
      let tr

      it('can be parsed', () => {
        ast = parser(c.in)
        tr = getTrObjects(ast)
      })

      it('produces proper translation object', () => {
        assert.strict.deepEqual(tr[0].string, c.translate)
      })

      it('can apply translation', () => {
        applyTr(ast, c.translated)
      })

      it('produces correct HTML', () => {
        assert.strict.deepEqual(render(ast), c.out)
      })
    })
  })
})
