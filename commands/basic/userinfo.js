const { Command } = include("bucket/index");
const moment = require('moment');

module.exports = class UserInfoCommand extends Command {
    constructor(...args) {
        super(...args, {
            name: 'userinfo',
            group: 'basic',
            aliases: ['user'],
            cooldown: 5,
            description: 'View ping bot',
            options: {
                guildOnly: true,
                localeKey: "commands"
            },
            usage: [{
                name: 'member',
                displayName: 'id/menção/username',
                type: 'member',
                optional: true
            }]
        });
    }

    handle({ args, client, msg, store }, responder) {
        let user = args.member ? args.member[0].id : msg.member.user.id
        user = msg.channel.guild.members.get(user)
        const permission = Object.entries(user.permission.json).filter((r) => r[1] === true) || "0"
        let clientStatus = user.clientStatus ? Object.entries(user.clientStatus).filter((s) => s[1] !== "offline") : null
        const userRoles = user.roles.map(r => msg.channel.guild.roles.get(r))
        const rolesOrder = userRoles.sort((a, b) => b.position - a.position)


        moment.locale(store.settings.locale)

        const embed = new client.embed
        embed
            .title(responder.t('{{whois.title}}'))

            /** 
              *field `user status` @online @idle @dnd @offline
              */
            .field('Status', responder.t(`{{whois.status.${user.status}}}`), true)

            .field('Mention', user.mention, true)
            .field('ID', user.id, true)

            /** 
             *field `user client status` @mobile @web @desktop
             */
            .field(responder.t('{{whois.clientStatus}}'),
                `\`\`\`Markdown\n# ${clientStatus ? clientStatus.map((r) => r[0]).join(" ") : "None"}\`\`\``, true)

            /** 
             *field `user playing` @playing or @none
             */

            .field(responder.t('{{whois.gamming}}'),
                `\`\`\`Markdown\n# ${user.game ? user.game.name : "none"}\`\`\``, true)

            /** 
             *field `user days entry server`
             */
            .field(responder.t('{{whois.entry_server}}'), responder.t('{{whois.day_entry}}', {
                days: moment().diff(user.joinedAt, "days") || "0"
            }), true)

            /** 
             *field `user days create account`
             */
            .field(responder.t('{{whois.create_account}}'), responder.t('{{whois.day_entry}}', {
                days: moment().diff(user.createdAt, "days") || "0"
            }), true)

            /** 
             *field `user roles in server`
             */
            .field(responder.t('{{whois.roles}}', { length: user.roles.length || "0" }),
                rolesOrder.map(r => `<@&${r.id}>`).join(', ') || "None", true)

            /** 
             *field `user is bot` @true or @false
             */
            .field('Bot', user.bot ? "``true``" : "``false``", true)
            .color(user.color)
            .thumbnail(user.user.dynamicAvatarURL())
            .timestamp()

        /** 
         *field `user nickname` case you have nickname
         */
        if (user.nick) embed.field(responder.t('{{whois.nickname}}'), user.nick, true)

        /** 
         *field `list permissions user in server`
         */
        embed.field(responder.t('{{whois.permissions}}', { length: permission.length || "0" }),
            `\`\`\`CSS\n${permission.map(r => r[0]).join(" | ")}\`\`\``, false)

        return responder.embed(embed).send().catch(this.logger.error)
    }
}