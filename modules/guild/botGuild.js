const { Module } = include("bucket");

module.exports = class botGuild extends Module {
    constructor(...args) {
        super(...args, {
            name: "botguild",
            events: {
                guildCreate: 'onJoin',
                guildDelete: 'onLeave'
            }
        });
    };
    get db() {
        return this._client.plugins.get('store');
    };
    onJoin(guild) {
        return this.db.guilds.create({ id: guild.id }).then(() => {
            return this._client.logger.info(`Added "${guild.name}" to MariaDB`)
        });
    };
    onLeave(guild) {
        return this.db.guilds.destroy( { where: { id: guild.id }}).then(() => {
            return this._client.logger.info(`Removed "${guild.name}" from MariaDB`)
        });
    };
};