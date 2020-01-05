let Promise
try {
  Promise = require('bluebird')
} catch (err) {
  Promise = global.Promise
}

const { delay: promDelay } = require('../util')

class Base {
  constructor (client) {
    this._client = client
    this.logger = client.logger
    this.i18n = client.plugins.get('i18n')
  }

  hasPermissions (channel, user, ...perms) {
    if (!channel.guild) return true;
    const member = channel.guild.members.get(user.id);
    for (const perm of perms) {
      if (!member.permission.has(perm)) return false;
    }
    return true;
  }

  t (content = '', tags = {}, lang = 'en') {
    if (!this.i18n) return content
    const file = this.name ? this.name.split(':')[0] : (this.labels ? this.labels[0] : 'common')
    return this.i18n.parse(content, this.localeKey || file || null, lang, tags)
  }

  async send (chan, content, options = {}) {
    const channel = typeof chan === 'string' ? this._client.getChannel(chan) : chan
    if (!channel) {
      const err = new Error(`Could not send message: Invalid channel - ${chan}`)
      if (this.logger) {
        this.logger.error(err)
        return
      } else {
        throw err
      }
    }

    let { file = null, lang, delay = 0, deleteDelay = 0, embed } = options
    if (channel.guild && !this.hasPermissions(channel, this._client.user, 'sendMessages')) {
      const err = new Error('Could not send message: Insufficient permissions')
      if (this.logger) {
        this.logger.error(err)
        return
      } else {
        throw err
      }
    }

    if (delay) await promDelay(delay)

    if (Array.isArray(content)) content = content.join('\n')
    if (this.i18n) content = this.t(content, lang, options)
    content = content.match(/(.|[\r\n]){1,2000}/g)

    try {
      if (!content || !content.length) {
        const msg = await channel.createMessage({ embed, content: '' }, file)
        return deleteDelay ? promDelay(deleteDelay).then(() => msg.delete()) : msg
      }

      let msg
      for (const c of content) {
        const firstMsg = await channel.createMessage(!msg ? { embed, content: c } : c, !msg ? file : null)
        .then(msg => deleteDelay ? promDelay(deleteDelay).then(() => msg.delete()) : msg)
        msg = firstMsg
      }

      return msg
    } catch (err) {
      if (this.logger) {
        this.logger.error('Could not send message -', err)
      } else {
        throw err
      }
    }
  }
  edit (msg, content, options) {
    const { lang, delay = 0 } = options

    if (Array.isArray(content)) content = content.join('\n')
    if (this.i18n) content = this.t(content, lang, options)

    return (delay ? promDelay(delay) : Promise.resolve()).then(() => msg.edit(content))
  }
  deleteMessages (...msgs) {
    const id = this._client.user.id
    return Promise.all(msgs.reduce((arr, msg) => {
      if (!msg || !msg.channel.guild) return arr
      if (msg.author.id === id || this.hasPermissions(msg.channel, msg.member, 'manageMessages')) {
        arr.push(msg.delete())
      }
      return arr
    }, []))
  }
}

module.exports = Base
