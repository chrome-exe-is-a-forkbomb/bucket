let Promise
let EventEmitter
try {
  Promise = require('bluebird')
} catch (err) {
  Promise = global.Promise
}
try {
  EventEmitter = require('eventemitter3')
} catch (err) {
  EventEmitter = require('events')
}

const path = require('path')

const { Collection, delay } = require('../util')

class Crystal extends EventEmitter {
  constructor (file, count = require('os').cpus().length) {
    super()
    this.clusters = new Collection()
    this._count = count
    this._file = path.isAbsolute(file) ? file : path.join(process.cwd(), file)
  }

  async createClusters () {
    for (let i = 0; i < this._count; i++) {
      this.createCluster(i)
      await delay(6000)
    }
  }

  createCluster (id) {
    const cluster = new (require('../structures')).Cluster(this._file, id)
    const worker = cluster.worker
    worker.on('exit', () => this.onExit(worker))
    worker.on('message', (msg) => this.onMessage(worker, msg))
    this.clusters.set(cluster.id, cluster)
    this.emit('clusterCreate', cluster.id)
  }

  getCluster (pid) {
    return this.clusters.find(s => s.pid === pid)
  }

  onExit (worker) {
    const cluster = this.getCluster(worker.pid)
    if (!cluster) return
    this.emit('clusterExit', worker.pid, cluster.id)
    this.clusters.delete(cluster.id)
    this.createCluster(cluster.id)
  }

  onMessage (worker, message) {
    if (!message.op) return
    if (message.op === 'resp') return
    if (this[message.op]) return this[message.op](message)

    this.awaitResponse(worker, message)
  }

  awaitResponse (worker, message) {
    const promises = []

    for (const cluster of this.clusters.values()) {
      promises.push(cluster.awaitResponse(message))
    }

    Promise.all(promises)
    .then(results => worker.send({ op: 'resp', d: results, code: message.code }))
    .catch(err => worker.send({ op: 'error', d: err, code: message.code }))
  }
  broadcast (message) {
    if (message.op === 'broadcast') {
      message = message.d
    }

    for (const cluster of this.clusters.values()) {
      cluster.worker.send(message)
    }
  }

  async restart (message = {}) {
    if (typeof message.d === 'number') {
      const cluster = this.clusters.get(message.d)
      if (!cluster) return
      cluster.worker.kill()
    } else {
      for (let cluster of this.clusters.values()) {
        cluster.worker.kill()
        await Promise.delay(6000)
      }
    }
  }
}

module.exports = Crystal
