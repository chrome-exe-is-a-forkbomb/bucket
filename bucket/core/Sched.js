let Promise
try {
  Promise = require('bluebird')
} catch (err) {
  Promise = global.Promise
}

const path = require('path')
const fs = require('fs')

const { requireRecursive, isDir } = require('../util')

class Bridge {
  constructor (client) {
    this.tasks = []
    this.collectors = []
    this._cached = []
    this._client = client
    this._commander = client.plugins.get('commands')
    if (!this._commander) {
      client.logger.warn('Commander plugin not found')
    }
  }

  register (middleware) {
    switch (typeof middleware) {
      case 'string': {
        const filepath = path.isAbsolute(middleware) ? middleware : path.join(process.cwd(), middleware)
        if (!fs.existsSync(filepath)) {
          throw new Error(`Folder path ${filepath} does not exist`)
        }
        this._cached.push(middleware)
        const mw = isDir(filepath) ? requireRecursive(filepath) : require(filepath)
        return this.register(mw)
      }
      case 'object': {
        if (Array.isArray(middleware)) {
          for (const mw of middleware) {
            this.push(mw)
          }
          return this
        }
        for (const key in middleware) {
          this.push(middleware[key])
        }
        return this
      }
      default: {
        throw new Error('Path supplied is not an object or string')
      }
    }
  }

  push (Middleware) {
    const middleware = typeof Middleware === 'function' ? new Middleware(this) : Middleware
    this.tasks.push(middleware)
    this.tasks.sort((a, b) => a.priority - b.priority)

    this._client.emit('bridge:registered', {
      name: middleware.name,
      index: this.tasks.indexOf(middleware),
      count: this.tasks.length
    })
    return this
  }
  collect (options = {}) {
    const { tries = 10, time = 60, matches = 10, channel, author, filter } = options
    const collector = {
      collected: [],
      _tries: 0,
      _matches: 0,
      _listening: false,
      _ended: false,
      _timer: time ? setTimeout(() => {
        collector._ended = {
          reason: 'timeout',
          arg: time,
          collected: collector.collected
        }
      }, time * 1000) : null
    }
    collector.stop = () => {
      collector._listening = false
      this.collectors.splice(this.collectors.indexOf(collector), 1)
    }
    collector.next = () => {
      return new Promise((resolve, reject) => {
        collector._resolve = resolve
        if (collector._ended) {
          collector.stop()
          reject(collector._ended)
        }
        collector._listening = true
      })
    }
    collector.passMessage = msg => {
      if (!collector._listening) return false
      if (author && author !== msg.author.id) return false
      if (channel && channel !== msg.channel.id) return false
      if (typeof filter === 'function' && !filter(msg)) return false

      collector.collected.push(msg)
      if (collector.collected.size >= matches) {
        collector._ended = { reason: 'maxMatches', arg: matches }
      } else if (tries && collector.collected.size === tries) {
        collector._ended = { reason: 'max', arg: tries }
      }
      collector._resolve(msg)
      return true
    }
    this.collectors.push(collector)
    return collector
  }

  destroy () {
    this.tasks = []
    this.collectors = []
  }

  unregister (name) {
    if (name === true) {
      return this.tasks.splice(0)
    }
    const middleware = this.tasks.find(mw => mw.name === name)
    if (!middleware) return null
    this.tasks.splice(this.tasks.indexOf(middleware, 1))
    return middleware
  }

  reload () {
    for (const filepath of this._cached) {
      this._client.unload(filepath)
      this._cached.shift()
      this.register(filepath)
    }
    return this
  }

  run () {
    this._client.on('messageCreate', msg => {
      if (this._client.selfbot) {
        if (msg.author.id !== this._client.user.id) return
      } else {
        if (msg.author.id === this._client.user.id || msg.author.bot) return
      }

      this.handle({
        msg: msg,
        client: this._client,
        logger: this._client.logger,
        admins: this._client.admins,
        commands: this._commander,
        modules: this._client.plugins.get('modules'),
        plugins: this._client.plugins,
        middleware: this
      }).catch(err => {
        if (err && this._client.logger) {
          this._client.logger.error('Failed to handle message in Bridge -', err)
        }
      })
    })
  }

  stop () {
    this._client.removeAllListeners('messageCreate')
  }
async handle (container) {
    const { msg } = container
    for (let collector of this.collectors) {
      const collected = collector.passMessage(msg)
      if (collected) return Promise.reject()
    }
    for (const task of this.tasks) {
      const result = await task.process(container)
      if (!result) return Promise.reject()
      container = result
    }
    if (!container.trigger) return Promise.reject()
    this._commander.execute(container.trigger, container)
    return container
  }
}

module.exports = Bridge
