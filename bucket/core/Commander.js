const path = require('path')
const fs = require('fs')
const util = require('util')

const { requireAll, isDir, Collection } = require('../util')

/**
 * Commander class for command processing
 * @prop {Set} prefixes Set of added prefixes
 */
class Commander extends Collection {
  constructor (client) {
    super()
    this._client = client
    this._cached = []

    this.prefixes = new Set()
    this.prefixes.add(client.prefix)
  }

  register (commands, options = {}) {
    switch (typeof commands) {
      case 'string': {
        const filepath = path.join(process.cwd(), commands)
        if (!fs.existsSync(filepath)) {
          throw new Error(`Folder path ${filepath} does not exist`)
        }
        const cmds = isDir(filepath) ? requireAll(filepath) : require(filepath)
        this._cached.push([commands, options])
        return this.register(cmds, options)
      }
      case 'object': {
        if (options.prefix) {
          this.prefixes.add(options.prefix)
        }
        if (Array.isArray(commands)) {
          for (const command of commands) {
            this.attach(command, null, options.prefix)
          }
          return this
        }
        for (const group in commands) {
          const command = commands[group]
          if (options.groupedCommands && typeof command === 'object') {
            for (const name in command) {
              this.attach(command[name], group, options.prefix)
            }
            continue
          }
          this.attach(command, group, options.prefix)
        }
        return this
      }
      default: {
        throw new Error('Path supplied is not an object or string')
      }
    }
  }

  attach (Command, group = 'misc', prefix) {
    if (Command instanceof Array) {
      for (const cmd of Command) {
        this.attach(cmd)
      }
      return this
    }
    let command = typeof Command === 'function' ? new Command(this._client) : Command
    if (!command.triggers || !command.triggers.length) {
      this._client.throwOrEmit('commander:error', new Error(`Invalid command - ${util.inspect(command)}`))
      return this
    }
    for (const trigger of command.triggers) {
      if (this.has(trigger)) {
        this._client.throwOrEmit('commander:error', new Error(`Duplicate command - ${trigger}`))
        return this
      }
      command.group = command.group || group
      command.prefix = command.prefix || prefix
      this.set(trigger.toLowerCase(), command)
    }

    this._client.emit('commander:registered', {
      trigger: command.triggers[0],
      group: command.group,
      aliases: command.triggers.length - 1,
      count: this.size
    })
    return this
  }

  unregister (group, trigger) {
    if (this.group) {
      return this.ejectGroup(group, trigger)
    }
    return this.eject(trigger)
  }

  eject (trigger) {
    const command = this.get(trigger)
    if (command) {
      for (const trigger of command.triggers) {
        this.delete(trigger)
      }

      this._client.emit('commander:ejectedGroup', {
        trigger: command.triggers[0],
        aliases: command.triggers.length - 1
      })
    }
    return this
  }

  ejectGroup (group = '*', trig) {
    let count = 0
    for (const [trigger, command] of this.entries()) {
      if (command.group === group || group === '*' && trig === trigger) {
        this.delete(trigger)
        count++
      }
    }

    this._client.emit('commander:ejectedGroup', { group, count })
    return this
  }
  reload () {
    this.clear()
    for (const [filepath, options] of this._cached) {
      this._client.unload(filepath)
      this._cached.shift()
      this.register(filepath, options)
    }
    return this
  }

  execute (trigger, ...args) {
    const command = this.get(trigger)
    if (!command) return
    try {
      command.execute(...args)
    } catch (err) {
      this._client.throwOrEmit('commander:commandError', err)
    }
  }
}

module.exports = Commander
