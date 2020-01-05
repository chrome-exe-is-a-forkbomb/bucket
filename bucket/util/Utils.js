let Promise
try {
  Promise = require('bluebird')
} catch (err) {
  Promise = global.Promise
}

const path = require('path')
const fs = require('fs')
const emoji = require("../../res/emoji.json");

const colours = {
  blue: '#117ea6',
  green: '#1f8b4c',
  red: '#be2626',
  pink: '#E33C96',
  gold: '#d5a500',
  silver: '#b7b7b7',
  bronze: '#a17419',
  orange: '#c96941'
}

class Utils {
  constructor (client) {
    Utils._client = client
  }
  static randomize(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  static get emojis () {
    return emoji
  }

  static isDir (fname) {
    return fs.existsSync(fname) ? fs.statSync(fname).isDirectory() : false
  }

  static padEnd (string = '', len = 0, chars = ' ') {
    const str = String(string)
    const pad = String(chars)
    return str.length >= len ? '' + str : str + pad.repeat(len - str.length)
  }

  static padStart (string = '', len = 0, chars = ' ') {
    const str = String(string)
    const pad = String(chars)
    return str.length >= len ? '' + str : (pad.repeat(len) + str).slice(-len)
  }

  static getColour (colour) {
    if (!colours[colour]) return
    return parseInt(String(colours[colour] || colour).replace('#', ''), 16) || null
  }

  static parseNumber (num) {
    return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  static hasRoleHierarchy (member, role) {
    const guild = member.guild
    return guild && member.roles.some(id => {
      const r = guild.roles.get(id)
      return r.position > role.position
    })
  }

  static requireRecursive (dir) {
    return fs.readdirSync(dir).reduce((arr, file) => {
      if (file.startsWith('.')) return arr
      const filepath = path.join(dir, file)
      arr.push(Utils.isDir(filepath) ? Utils.requireRecursive(filepath) : require(filepath))
      return arr
    }, [])
  }

  static requireAll (dir) {
    return fs.readdirSync(dir).reduce((obj, file) => {
      if (file.startsWith('.')) return obj
      const filepath = path.join(dir, file)
      obj[file.substring(0, path.basename(filepath, path.extname(filepath)).length)] = Utils.isDir(filepath)
      ? Utils.requireAll(filepath) : require(filepath)
      return obj
    }, {})
  }

  static delay (time) {
    return new Promise((resolve) => setTimeout(() => resolve(), time))
  }
}

module.exports = Utils
