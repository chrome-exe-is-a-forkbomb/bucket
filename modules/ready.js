const { Module } = require('../bucket');

module.exports = class Ready extends Module {
    constructor(...args) {
        super(...args, {
            name: "system:ready",
            events: { ready: "connected" }
        })
    }
    connected() {
        this.logger.info("SERVER STARTED!");
    }
}