'use strict'

const {Transformer} = '@parcel/plugin'
const parse = require('posthtml-parser')
const nullthrows = require('nullthrows')
const render = require('posthtml-render')
const semver = require('semver')

const path = require('path')
const fs = require('fs')

const {getTrObjects, applyTr} = require('./utils')

const defaults = {
  sourceLanguage: 'en',
  translationPath: './l10n',
  autoAdd: true,
  autoRemove: true
}

module.exports = new Transformer({
  async getConfig ({asset}) {
    const config =
      (await asset.getConfig(['.localize', '.localize.js', 'localize.config.js'])) || {}
    return config
  },

  canReuseAST ({ast}) {
    return ast.type === 'posthtml' && semver.satisfies(ast.version, '^0.4.0')
  },

  async parse ({asset}) {
    return {
      type: 'posthtml',
      version: '0.4.1',
      program: parse(await asset.getCode(), {
        lowerCaseAttributeNames: true
      })
    }
  },

  async transform ({asset, config, options}) {
    // TODO: don't mess with translation files in production/build, only dev

    for (const key in defaults) {
      if (typeof config[key] === 'undefined') { // apply defaults
        config[key] = defaults[key]
      }
    }

    const isProd = options.production
    const translationDir = null // TODO: add

    const files = await asset.fs.readdir(translationDir)

    return Promise.all(files.concat('_').map(async (name) => { // TODO: cache getTrObjects ast
      let lang
      let langCode
      let realPath

      if (name === '_') {
        lang = {}
        langCode = config.sourceLanguage
      } else {
        realPath = path.join(translationDir, name)
        lang = await JSON.parse(String(asset.fs.readFile() || {}))
        langCode = path.basename(name, '.json')
      }

      let newAst = JSON.parse(JSON.stringify(asset.ast))
      const tr = getTrObjects(newAst)

      let keys = []

      tr.forEach((translation) => {
        if (!isProd && config.autoAdd && typeof lang[translation.string]) {
          lang[translation.string] = ''
        }

        const translated = lang[translation.string] || ''

        if (!isProd && config.autoRemove) {
          keys.push(translation.string)
        }

        applyTr(translation, translated)
      })

      if (!isProd && config.autoRemove) {
        for (const key in lang) {
          if (keys.indexOf(key) === -1) {
            delete lang[key]
          }
        }
      }

      if (!isProd && realPath) {
        fs.writeFileSync(realPath, JSON.stringify(lang, null, 2))
      }

      // return some asset with path.join(langCode, asset.filePath) or sth like that

      return {
        type: 'html',
        ast: newAst,
        meta: { // TODO: fix this
          filePath: asset.filePath,
          outPath: path.join(langCode, asset.filePath)
        }
      }
    }))
  },

  generate ({asset}) {
    return {
      code: render(nullthrows(asset.ast).program)
    }
  }
})
