const { Module } = include("bucket");

module.exports = class Ready extends Module {
    constructor(...args) {
        super(...args, {
            name: "system",
            events: { ready: "connected" }
        })
    }
    connected() {
        const { guilds, users } = this._client;
        const statuses = [
            { type: 0, name: 'As trevas aguardam seu momento de glória enquanto a luz glorifica sua fajuta vitória.' },
            { type: 0, name: `com ${users.size} usuários` },
            { type: 2, name: `para ${users.size} usuários` },
            { type: 3, name: `${users.size} usuários` },
            { type: 0, name: `Em ${guilds.size} servidores` },
            { type: 3, name: `${guilds.size} servidores` }
        ];
        this.logger.info("Eu estou rodando com nome: ", this._client.user.username);
        setInterval(() => {
            this._client.editStatus(statuses[~~(Math.random() * statuses.length)])
        }, 60 * 1000)
    }
}