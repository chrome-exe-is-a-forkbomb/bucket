/**
 * Permission checker
 */
class Permitter {
  static get contexts () {
    return ['members', 'roles', 'channels']
  }

  static isBoolean (val) {
    return val === true || val === false
  }

  static hasWildcard (obj) {
    return obj !== null && '*' in obj ? this.isBoolean(obj['*']) : false
  }

  static verifyMessage (node, msg, perms = {}, defVal = true) {
    if (!msg.channel.guild) return true
    let res = this.check(`${msg.channel.id}.${msg.author.id}.${node}`, perms)
    if (this.isBoolean(res)) return res

    for (const perm of msg.member.roles.map(r => `${msg.channel.id}.${r}.${node}`)) {
      res = this.check(perm, perms)
      if (this.isBoolean(res)) return res
    }

    res = this.check(`*.${msg.author.id}.${node}`, perms)
    if (this.isBoolean(res)) return res

    for (const perm of msg.member.roles.map(r => `*.${r}.${node}`)) {
      res = this.check(perm, perms)
      if (this.isBoolean(res)) return res
    }

    res = this.check(`${msg.channel.id}.${node}`, perms)
    if (this.isBoolean(res)) return res

    res = this.check(`*.*.${node}`, perms)
    if (this.isBoolean(res)) return res

    return defVal
  }

  static check (node, perms = {}) {
    const res = node.split('.').reduce((obj, idx) => {
      if (obj === null || this.isBoolean(obj)) return obj
      if (idx in obj) return obj[idx]
      else if ('*' in obj) return obj['*']
      return null
    }, perms)
    if (res === true || res === false) return res
    return null
  }

  static allow (node, perms) {
    return this.grant(node, true, perms)
  }
static deny (node, perms) {
    return this.grant(node, false, perms)
  }

  static grant (node, val = true, rawPerms = {}) {
    const nodes = node.split('.')
    const last = nodes.length - 1

    nodes.reduce((o, c, i) => {
      if (i >= last) {
        if (typeof o['*'] === 'undefined') o['*'] = null
        if (o[c] === true || o[c] === false && o[c] !== val) {
          o[c] = null
        } else {
          o[c] = val
        }
      } else if (typeof o[c] === 'undefined') {
        o[c] = {}
      } else if (o[c] === true || o[c] === false) {
        o[c] = { '*': o[c] }
      }
      return o[c]
    }, rawPerms)

    return rawPerms
  }
}

module.exports = Permitter
