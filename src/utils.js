'use strict'

const placeholderCharacter = 'æ'

const dset = require('dset')

function parseTrString (str) {
  // return str.split(reverseLookbehind not escape + placeholderCharacter{1})
  let i = 0

  let split = []

  let out = ''

  while (str.length > i) {
    let cur = str[i]
    let next = str[i + 1]
    if (cur === '\\' && next === placeholderCharacter) {
      out += cur
      i++ // dbl increase
    } else if (cur === placeholderCharacter) {
      split.push(out)
      out = ''
    } else {
      out += cur
    }
    i++
  }

  if (out) {
    split.push(out)
  }

  return split
}

function stringifyTrList (list) {
  return list
    .map(str => str.replace(new RegExp(placeholderCharacter, 'g'), '\\' + placeholderCharacter))
    .join(placeholderCharacter)
}

function getTrObjects (ast) {
  /*

  1. Search for <translate> objects
  2. createTrString() from their sub-AST
  3. Keep reference to sub-AST

  */

  /*
  for '<translate><h2>test <b>you</b></h2>'

  astRef: [linkToTextNode, linkToTextNode],
  trList: ['test ', 'you']
  */

  /*
  let conv1 = [
    { // 0
      tag: 'translate',
      attrs: {},
      content: [
        'hello', // :0
        {
          tag: 'h2', // :1
          attrs: {},
          content: ['world'] // :1.0
        }
      ]
    }
  ]

  trList = ['Hello', 'world']
  refList = [[0], [1, 0]]
  */

  let tr = []

  function walkTranslate (el, id, refs, str) {
    if (typeof el === 'string') {
      str.push(el)
      refs.push(id)
    } else {
      walkTranslateArray(el.content, id, refs, str)
    }
  }

  function walkTranslateArray (ar, ids, refs, str) {
    ar.forEach((el, id) => {
      walkTranslate(el, ids.concat([id]), refs, str)
    })
  }

  function walk (el, id) {
    if (typeof el === 'string') return

    if (el.tag === 'translate') {
      let refs = []
      let str = []
      walkTranslateArray(el.content, [], refs, str)

      tr.push({
        id,
        el,
        refs,
        ast,
        string: stringifyTrList(str)
      })
    } else {
      walkArray(el.content, id)
    }
  }

  function walkArray (ar, ids) {
    ar.forEach((el, id) => {
      walk(el, ids.concat([id]))
    })
  }

  walkArray(ast, [])

  return tr
}

function idToPath (id) {
  return id.reduce((all, b) => {
    all.push('content', b)

    return all
  }, [])
}

function applyTr (translation, translated) {
  /*

  1. Parse translated using parseTrString
  2. Link from astRef, overwrite

  */

  if (translated) {
    const trs = parseTrString(translated)
    trs.forEach((newValue, id) => {
      dset(translation.el, idToPath(translation.refs[id]), newValue)
    })
  }

  let fakeTag = {content: translation.ast}

  dset(fakeTag, idToPath(translation.id), translation.el.content)
}

module.exports = {
  getTrObjects,
  applyTr
}
