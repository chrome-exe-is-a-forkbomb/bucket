const path = require('path')
const Eris = require('eris')
require("eris-additions")(Eris)

const { Commander, Router, Sched, Interpreter, Logger } = require('./core')
const { Collection } = require('./util')

class Client extends Eris.Client {
  constructor (options = {}) {
    super(options.token, options)
    this.selfbot = options.selfbot
    this.prefix = options.prefix || '!'
    this.suppressWarnings = options.suppressWarnings
    this.noDefaults = options.noDefaults
    this.admins = Array.isArray(options.admins) ? options.admins : []
    this.embed = Eris.Embed
    this._resolvers = options.resolvers

    this.plugins = new Collection()

    if (!this.noDefaults) {
      this
      .createPlugin('commands', Commander, options)
      .createPlugin('modules', Router, options)
      .createPlugin('middleware', Sched, options)
      .createPlugin('i18n', Interpreter, options)
      .createPlugin('logger', Logger, options)

      this.register('i18n', path.join(__dirname, '..', 'inter'))
      this.register('middleware', path.join(__dirname, '..', 'preprocessing'))

      if (options.commands) this.register('commands', options.commands)
      if (options.modules) this.register('modules', options.modules)
      if (options.middleware) this.register('middleware', options.middleware)
      if (options.locales) this.register('i18n', options.locales)
    }
  }

  get logger () {
    return this.plugins.get('logger')
  }

  createPlugin (type, Plugin, options) {
    const plugin = new Plugin(this, options)
    this.plugins.set(type, plugin)
    return this
  }

  register (type, ...args) {
    if (typeof type !== 'string') {
      throw new Error('Invalid type supplied to register')
    }
    const plugin = this.plugins.get(type)
    if (!plugin) {
      throw new Error(`Plugin type ${type} not found`)
    }
    if (typeof plugin.register === 'function') plugin.register(...args)
    return this
  }

  unregister (type, ...args) {
    if (typeof type !== 'string') {
      throw new Error('Invalid type supplied to register')
    }
    const plugin = this.plugins.get(type)
    if (!plugin) {
      throw new Error(`Plugin type ${type} not found`)
    }
    if (typeof plugin.unregister === 'function') plugin.unregister(...args)
    return this
  }

  unload (filepath) {
    Object.keys(require.cache).forEach(file => {
      const str = path.isAbsolute(filepath) ? filepath : path.join(process.cwd(), filepath)
      if (str === file || file.startsWith(str)) {
        delete require.cache[require.resolve(file)]
      }
    })
    return this
  }

  run () {
    if (typeof this.token !== 'string') {
      throw new TypeError('No bot token supplied')
    }
    this.plugins.forEach(plugin => {
      if (typeof plugin.run === 'function') plugin.run()
    })
    return this.connect()
  }

  throwOrEmit (event, error) {
    if (!this.listeners(event).length) {
      throw error
    }
    this.emit(event, error)
  }
}

module.exports = Client


