let Promise
try {
  Promise = require('bluebird')
} catch (err) {
  Promise = global.Promise
}

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const { Collection, requireAll, isDir } = require('../util')

class Transmitter extends Collection {
  constructor (client) {
    super()

    this.pid = process.pid
    this._client = client
    this._cached = []

    process.on('message', this.onMessage.bind(this))
  }

  send (event, data) {
    process.send({
      op: event,
      d: data
    })
  }

  onMessage (message) {
    if (!message.op) {
      if (!this._client.suppressWarnings) {
        this._client.logger.warn('Received IPC message with no op')
      }
      return
    }

    if (['resp', 'broadcast'].includes(message.op)) return

    const command = this.get(message.op)
    if (command) {
      return command(message, this._client)
    }
  }

  async awaitResponse (op, d) {
    const code = crypto.randomBytes(64).toString('hex')
    return new Promise((resolve, reject) => {
      const awaitListener = (msg) => {
        if (!['resp', 'error'].includes(msg.op)) return
        process.removeListener('message', awaitListener)
        if (msg.op === 'resp' && msg.code === code) return resolve(msg.d)
        if (msg.op === 'error') return reject(msg.d)
      }

      const payload = { op, code }
      if (d) payload.d = d

      process.on('message', awaitListener)
      process.send(payload)

      setTimeout(() => {
        process.removeListener('message', awaitListener)
        return reject('IPC timed out after 2000ms')
      }, 2000)
    })
  }

  register (commands) {
    switch (typeof commands) {
      case 'string': {
        const filepath = path.join(process.cwd(), commands)
        if (!fs.existsSync(filepath)) {
          throw new Error(`Folder path ${filepath} does not exist`)
        }
        const cmds = isDir(filepath) ? requireAll(filepath) : require(filepath)
        this._cached.push(commands)
        return this.register(cmds)
      }
      case 'object': {
        if (Array.isArray(commands)) {
          for (const command of commands) {
            if (typeof command === 'object') {
              this.register(command)
              continue
            }
            this.attach(command)
          }
          return this
        }
        for (const group in commands) {
          const command = commands[group]
          if (typeof command === 'object') {
            this.register(command)
            continue
          }
          this.attach(command)
        }
        return this
      }
      default: {
        throw new Error('Path supplied is not an object or string')
      }
    }
  }

  reload () {
    for (const filepath of this._cached) {
      this._client.unload(filepath)
      this._cached.shift()
      this.register(filepath)
    }
    return this
  }

  attach (command) {
    if (!command.name && (typeof command.command !== 'function' || typeof command !== 'function')) {
      this._client.throwOrEmit('ipc:error', new TypeError(`Invalid command - ${command}`))
      return
    }
    this.set(command.name, command.command || command)
    return this
  }

  unregister (name) {
    this.delete(name)
    return this
  }
}

module.exports = Transmitter
