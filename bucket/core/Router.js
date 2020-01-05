const path = require('path')
const fs = require('fs')

const { requireRecursive, isDir, Collection } = require('../util')

class Router extends Collection {
  constructor (client) {
    super()
    this._client = client
    this._cached = []
    this.events = {}
  }

  register (modules) {
    switch (typeof modules) {
      case 'string': {
        const filepath = path.join(process.cwd(), modules)
        if (!fs.existsSync(filepath)) {
          throw new Error(`Folder path ${filepath} does not exist`)
        }
        const mods = isDir(filepath) ? requireRecursive(filepath) : require(filepath)
        this._cached.push(modules)
        return this.register(mods)
      }
      case 'object': {
        if (Array.isArray(modules)) {
          for (const module of modules) {
            this.attach(module)
          }
          return this
        }
        for (const key in modules) {
          this.attach(modules[key])
        }
        return this
      }
      default: {
        throw new Error('Path supplied is not an object or string')
      }
    }
  }

  attach (Module) {
    if (Module instanceof Array) {
      for (const mod of Module) {
        this.attach(mod)
      }
      return this
    }
    const module = typeof Module === 'function' ? new Module(this._client) : Module
    this.set(module.name, module)
    for (const event in module.events) {
      if (typeof this.events[event] === 'undefined') {
        this.record(event)
      }

      const listener = module.events[event]
      if (typeof module[listener] !== 'function') {
        this._client.throwOrEmit('router:error', new TypeError(`${listener} in ${module.name} is not a function`))
        return this
      }

      this.events[event] = Object.assign(this.events[event] || {}, { [module.name]: listener })
    }

    this._client.emit('router:registered', {
      name: module.name,
      events: Object.keys(module.events || {}).length,
      count: this.size
    })
    return this
  }

  record (event) {
    this._client.on(event, (...args) => {
      const events = this.events[event] || {}
      for (const name in events) {
        const module = this.get(name)
        if (!module) continue
        try {
          if (!module._client) args.push(this._client)
          module[events[name]](...args)
        } catch (err) {
          this._client.throwOrEmit('router:runError', err)
        }
      }
    })
    return this
  }
  run () {
    this.forEach(module => {
      if (typeof module.init === 'function') {
        module.init()
      }
    })
    return this
  }
  unregister () {
    return this.destroy()
  }

  destroy () {
    for (const event in this.events) {
      this.events[event] = {}
    }
    this.forEach(module => {
      if (typeof module.unload === 'function') {
        module.unload()
      }
      module = null
    })
    this.clear()
    return this
  }

  reload () {
    this.destroy()
    for (const filepath of this._cached) {
      this._client.unload(filepath)
      this._cached.shift()
      this.register(filepath)
      this.run()
    }
    return this
  }
}

module.exports = Router
