import {Transformer} from '@parcel/plugin'
import parse from 'posthtml-parser'
import nullthrows from 'nullthrows'
import render from 'posthtml-render'
import semver from 'semver'

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

    const files = await asset.fs.readdirSync(translationDir)

    return [asset]
  },

  generate ({asset}) {
    return {
      code: render(nullthrows(asset.ast).program)
    }
  }
})
