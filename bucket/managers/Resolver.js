let Promise
try {
  Promise = require('bluebird')
} catch (err) {
  Promise = global.Promise
}

const { requireRecursive, Collection } = require('../util')

class Resolver extends Collection {
  constructor (client) {
    super()
    this._client = client
  }

  loadResolvers (path) {
    const resolvers = requireRecursive(path)
    for (const name in resolvers) {
      const resolver = resolvers[name]
      if (!resolver.resolve || !resolver.type) continue
      this.set(resolver.type, resolver)
    }
    return resolvers
  }

  load (data) {
    this.usage = this.verify(data)
  }

  verify (usage) {
    return (Array.isArray(usage) ? usage : [usage]).map(entry => {
      if (!entry.name) {
        throw new Error('Argument specified in usage has no name')
      }
      if (!entry.types) entry.types = [ entry.type || 'string' ]

      if (!entry.displayName) entry.displayName = entry.name
      return entry
    })
  }

  resolve (message, rawArgs, data, rawUsage = this.usage) {
    let args = {}

    const usage = this.verify(rawUsage)
    if (!usage.length) return Promise.resolve(args)

    const argsCount = rawArgs.length
    const requiredArgs = usage.filter(arg => !arg.optional).length
    const optionalArgs = argsCount - requiredArgs

    if (argsCount < requiredArgs) {
      return Promise.reject({
        message: 'INSUFFICIENT_ARGS',
        requiredArgs: `**${requiredArgs}**`,
        argsCount: `**${argsCount}**.`,
        usage: this.getUsage(this.usage, data),
      })
    }

    let idx = 0
    let optArgs = 0
    let resolves = []
    let skip = false
    for (const arg of usage) {
      let rawArg = rawArgs[idx]
      if (arg.last) {
        rawArg = rawArgs.slice(idx).join(' ')
        skip = true
      } else {
        if (arg.optional) {
          if (optionalArgs > optArgs) {
            optArgs++
          } else {
            if (arg.default) args[arg.name] = arg.default
            continue
          }
        }
        if (typeof rawArg !== 'undefined') {
          if (rawArg.startsWith('"')) {
            const endQuote = rawArgs.findIndex((str, i) => str.endsWith('"') && i >= idx)
            if (endQuote > -1) {
              rawArg = rawArgs.slice(idx, endQuote + 1).join(' ').replace(/"/g, '')
              idx = endQuote
            } else {
              return Promise.reject({ message: 'NO_END_QUOTE' })
            }
          }
        }
        idx++
      }
      resolves.push(this._resolveArg(arg, rawArg, message, data, usage).then(res => {
        args[arg.name] = res
        return res
      }))
      if (skip) break
    }
    return Promise.all(resolves).then(() => args)
  }

  _resolveArg (arg, rawArg, message, data, usage) {
    const resolves = arg.types.map(type => {
      const resolver = this.get(type)
      if (!resolver) {
        return Promise.resolve({ err: 'INVALID_RESOLVER_TYPE' })
      }
      return resolver.resolve(rawArg, arg, message, this._client)
      .catch(err => {
        let error
        let resp = arg
        if (err.message) {
          error = err.message
          /*for (const key in err) {
            if (key === 'message') continue
            error = err[key]
          }*/
        } else {
          error = err
        }
        return Object.assign(resp, {
          arg: `**\`${arg.name || 'argument'}\`**`,
          err: error
        })
      })
    })
    return Promise.all(resolves).then(results => {
      const resolved = results.filter(v => !v.err)
      if (resolved.length) {
        const res = resolved.length === 1 ? resolved[0] : resolved.reduce((arr, c) => arr.concat(c), [])
        return res
      }
      let err = results[0].err
      if (err instanceof Error) {
        return Promise.reject({ message: 'PARSING_ERROR', err })
      }
      return Promise.reject(Object.assign(results[0], {
        message: err,
        arg: `**\`${arg.name || 'argument'}\`**`,
        usage: this.getUsage(this.usage, data)
      }))
    })
  }

  getUsage (usage = this.usage, { prefix, command } = {}) {
    const argsUsage = usage.map(arg =>
      arg.last ? arg.displayName : arg.optional ? `[${arg.displayName}]` : `<${arg.displayName}>`
    ).join(' ')
    return `${prefix}${command}` + (usage.length ? ' ' + argsUsage : '')
  }
}

module.exports = Resolver
