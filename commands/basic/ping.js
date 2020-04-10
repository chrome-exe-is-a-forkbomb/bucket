const { Command } = include('bucket/index')

module.exports = class PingCommand extends Command {
    constructor(...args) {
        super(...args, {
            name: 'ping',
            group: 'basic',
            aliases: [],
            cooldown: 5,
            description: 'View ping bot',
            options: {
                guildOnly: true,
            },
            usage: []
        })
    }

    async handle({ msg }, responder) {
        return responder.reply(`${msg.channel.guild.shard.latency} ms`)
    }
}