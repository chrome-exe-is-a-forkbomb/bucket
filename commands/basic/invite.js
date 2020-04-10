const { Command } = include("bucket/index");

module.exports = class InviteCommand extends Command {
    constructor(...args) {
        super(...args, {
            name: 'invite',
            group: 'basic',
            aliases: ['iv'],
            cooldown: 5,
            description: 'Make invite to bot',
            options: {
                guildOnly: true,
                localeKey: "commands"
            },
            usage: []
        })
    }

    async handle({ msg, client }, responder) {
        const embed = new client.embed
        embed
            .description(responder.t('{{botInvite}}', {
                url: `https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=8`
            }))
            .color(11220318)
            .image(client.user.dynamicAvatarURL(null, 512))
            .footer(`${msg.author.username}#${msg.author.discriminator}`, msg.author.avatarURL)
            .timestamp()

        responder.embed(embed).send()
    }
}