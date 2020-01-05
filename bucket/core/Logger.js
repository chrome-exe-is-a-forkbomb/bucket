const { Collection, Terminal } = require('../util')

class Logger extends Collection {
  constructor (client, options = {}) {
    super()
    this._client = client
    this.register('console', Terminal, options)

    this.logLevels = options.levels || ['log', 'info', 'warn', 'error', 'debug']
    this.logLevels.forEach(this.addLevel.bind(this))
  }

  addLevel (level) {
    this[level] = (...args) => this.forEach(logger => (logger[level] || logger.log).bind(logger)(...args))
    return this
  }

  register (name, Transport, options) {
    this.set(name, typeof Transport === 'function' ? new Transport(options) : Transport)
    return this
  }

  unregister (name) {
    this.delete(name)
    return this
  }
}

module.exports = Logger
