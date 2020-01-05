let Promise
try {
  Promise = require('bluebird')
} catch (err) {
  Promise = global.Promise
}

const child = require('child_process')
class Cluster {
  constructor (file, id) {
    this.worker = child.fork(file, { env: Object.assign(process.env, { PROCESS_ID: id }) })
    this.id = id
  }

  awaitResponse (message) {
    return new Promise((resolve, reject) => {
      const awaitListener = (msg) => {
        if (!['resp', 'error'].includes(msg.op)) return
        return resolve({ id: this.id, result: msg.d, code: msg.code })
      }

      this.worker.once('message', awaitListener)
      this.worker.send(message)

      setTimeout(() => {
        this.worker.removeListener('message', awaitListener)
        return reject('IPC request timed out after 5000ms')
      }, 5000)
    })
  }
}

module.exports = Cluster
