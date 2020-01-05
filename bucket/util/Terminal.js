/** Default console logger */
class Terminal {
  /**
   * Creates a new Terminal instance
   * @arg {Object} [options] Terminal options
   * @arg {String} [options.loggerPrefix] Option for a prefix before logging
   * @arg {Boolean} [options.suppressWarnings=false] Option to suppress warnings
   * @arg {Boolean} [options.timestamps=true] Option to show timestamps
   */
  constructor ({ loggerPrefix, suppressWarnings, timestamps = true } = {}) {
    this._timestamps = timestamps
    this._name = loggerPrefix ? `- [${loggerPrefix}]` : ''

    for (const code in this.codes) {
      const val = this.codes[code]
      this[code] = this.supportsColours ? (str) => `\u001b[${val[0]}m${str}\u001b[${val[1]}m` : (str) => str
    }
  }

  log (...args) {
    console.log(this.timestamp + this._name, ...args)
  }
  info (...args) {
    console.log(this.timestamp, this._name + this.green('[BUCKET]') + ' -', ...args)
  }

  warn (...args) {
    console.log(this.timestamp, this._name + this.yellow('[BUCKET - WARNING]') + ' -', ...args)
  }

  error (...args) {
    console.log(this.timestamp, this._name + this.red('[BUCKET - ERROR]') + ' -',
    ...args.map(e => e instanceof Error ? e.stack : e))
  }

  debug (...args) {
    console.log(this.timestamp, this._name + this.grey('[BUCKET - DEBUG]') + ' -', ...args)
  }

  get codes () {
    return {
      reset: [0, 0],

      bold: [1, 22],
      dim: [2, 22],
      italic: [3, 23],
      underline: [4, 24],
      inverse: [7, 27],
      hidden: [8, 28],
      strikethrough: [9, 29],

      black: [30, 39],
      red: [31, 39],
      green: [32, 39],
      yellow: [33, 39],
      blue: [34, 39],
      magenta: [35, 39],
      cyan: [36, 39],
      white: [37, 39],
      grey: [90, 39],

      bgBlack: [40, 49],
      bgRed: [41, 49],
      bgGreen: [42, 49],
      bgYellow: [43, 49],
      bgBlue: [44, 49],
      bgMagenta: [45, 49],
      bgCyan: [46, 49],
      bgWhite: [47, 49]
    }
  }

  get timestamp () {
    const time = new Date().toISOString()
    return this._timestamps ? `[${this.grey(time.slice(time.indexOf('T') + 1).replace(/\..+/, ''))}]` : ''
  }

  supportsColours () {
    if (process.stdout && !process.stdout.isTTY) return false
    if (process.platfrom === 'win32') return true
    if ('COLORTERM' in process.env) return true
    if (process.env.TERM === 'dumb') return false
    if (['screen', 'xterm', 'vt100', 'color', 'ansi', 'cygwin', 'linux'].includes(process.env.TERM)) return true
    return false
  }

  stripColour (str) {
    return String(str).replace(/\x1B\[\d+m/g, '')
  }
}

module.exports = Terminal
