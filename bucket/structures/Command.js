const path = require('path')
const moment = require("moment");
const { Collection } = require('../util')
const { Responder, Resolver } = require('../managers')
const Base = require('./Base')

class Command extends Base {
  constructor (client, ...args) {
    super(client)
    if (this.constructor === Command) {
      throw new Error('Must extend abstract Command')
    }

    const resolver = this.resolver = new Resolver(client)
    if (!client.noDefaults) {
      resolver.loadResolvers(path.join(__dirname, '..', 'resolvers'))
    }
    if (client._resolvers) {
      resolver.loadResolvers(client._resolvers)
    }

    this.responder = new Responder(this)
    this.subcommands = new Collection()
    this.timers = new Map()

    this._options = args.reduce((p, c) => Object.assign(c, p), {})
  }

  set _options (args = {}) {
    const {
      name,
      description,
      group = 'none',
      aliases = [],
      cooldown = 5,
      usage = [],
      options = {},
      subcommands = {},
      subcommand
    } = args

    this.triggers = typeof name === 'string'
    ? [name].concat(aliases)
    : (Array.isArray(aliases) && aliases.length > 0 ? aliases : [])

    if (!this.triggers.length) {
      throw new Error(`${this.constructor.name} command is not named`)
    }

    this.name = name
    this.description = description
    this.cooldown = cooldown
    this.options = options
    if (this.options.modOnly) {
      this.options.permissions = (options.permissions || []).concat('manageGuild')
    }

    this.group = group
    this.usage = usage
    this.localeKey = options.localeKey
    this.resolver.load(usage)

    for (const command in subcommands) {
      const name = subcommands[command].name || command
      for (const alias of [name].concat(subcommands[command].aliases || [])) {
        this.subcommands.set(alias, {
          name,
          usage: subcommands[command].usage || [],
          options: subcommands[command].options || {}
        })
      }
    }
    this.subcommand = subcommand
  }
  execute (container) {
    const responder = this.responder.create(container)

    let usage = this.usage
    let process = 'handle'

    const subcmd = this.subcommand ? this.subcommand : container.rawArgs[0]
    const cmd = this.subcommands.get(subcmd)
    if (cmd) {
      usage = cmd.usage
      process = cmd.name
      container.rawArgs = container.rawArgs.slice(this.subcommand ? 0 : 1)
      container.trigger += ' ' + subcmd
    }

    if (!this.check(container, responder, cmd)) return

    return this.resolver.resolve(container.msg, container.rawArgs, {
      prefix: (container.settings || {}).prefix || this._client.prefix,
      command: container.trigger
    }, usage).then((args = {}) => {
      container.args = args
      return this[process](container, responder)
    }, err => responder.error(`{{%errors.${err.message}}}`, err)).catch(this.logger.error)
  }
  check ({ msg, isPrivate, admins, client }, responder, subcmd) {
    if(moment().diff(msg.author.cooldown || 0) < 0) {
      responder.error('{{%errors.ON_COOLDOWN}}', {
        delay: 0,
        deleteDelay: 5000,
        time: `**${moment(moment(msg.author.cooldown).diff(new Date())).format('s')}**`
      })
      return false
    }
    const isAdmin = admins.includes(msg.author.id)
    const { guildOnly, permissions = [], botPerms = [] } = subcmd ? subcmd.options : this.options
    const adminOnly = (subcmd && subcmd.options.adminOnly) || this.options.adminOnly

    if (adminOnly === true && !isAdmin) {
      return false
    }

    if (guildOnly === true && isPrivate) {
      responder.format('emoji:error').send('{{%errors.NO_PMS}}')
      return false
    }

    if (permissions.length && !(isAdmin || this.hasPermissions(msg.channel, msg.author, ...permissions))) {
      responder.error('{{%errors.NO_PERMS}}', {
        perms: permissions.map(p => `\`${p}\``).join(', ')
      })
      return false
    }

    if (botPerms.length && !this.hasPermissions(msg.channel, client.user, ...botPerms)) {
      responder.error('{{%errors.NO_PERMS_BOT}}', {
        perms: botPerms.map(p => `\`${p}\``).join(', ')
      })
      return false
    }

    /**
     * Cooldown system with @Moment module!
     */

    if (isAdmin) return true

    msg.author.cooldown = moment().add(this.cooldown, 'seconds');
    return true
  }

  async handle (container, responder) { return true }

  get permissionNode () {
    return `${this.group}.${this.triggers[0]}`
  }
}

module.exports = Command
