import {Transformer} from '@parcel/plugin'
import parse from 'posthtml-parser'
import nullthrows from 'nullthrows'
import render from 'posthtml-render'
import semver from 'semver'

import path from 'path'
import fs from 'fs'

import {getTrObjects, applyTr} from './utils'

const defaults = {
  sourceLanguage: 'en',
  translationPath: './l10n',
  autoAdd: true,
  autoRemove: true
}

export default new Transformer({
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

    return Promise.all(files.concat('_').map(async (name) => {
      let lang
      let out
      let realPath

      if (name === '_') {
        lang = {}
        out = config.sourceLanguage
      } else {
        realPath = path.join(translationDir, name)
        lang = await JSON.parse(String(asset.fs.readFile() || {}))
        out = path.basename(name, '.json')
      }

      let newAst = asset.ast.clone()
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

        if (translated) {
          applyTr(translation, translated)
        }
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

      // return some asset with path.join(out, asset.filePath) or sth like that
    }))
  },

  generate ({asset}) {
    return {
      code: render(nullthrows(asset.ast).program)
    }
  }
})
