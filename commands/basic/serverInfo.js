const { Command } = include("bucket/index");
const moment = require('moment');

module.exports = class ServerInfoCommand extends Command {
    constructor(...args) {
        super(...args, {
            name: 'serverinfo',
            group: 'basic',
            aliases: ['server', 'sv'],
            cooldown: 5,
            description: 'View ping bot',
            options: {
                guildOnly: true,
                localeKey: "commands"
            },
            usage: []
        });
    }

    handle({ client, msg, store }, responder) {
        const embed = new client.embed
        const guild = msg.channel.guild;

        moment.locale(store.settings.locale)

        const iconURL = guild.iconURL ?
            guild.iconURL :
            client.user.dynamicAvatarURL(null, 512)

        return responder.embed(
            embed
                .author(guild.name, iconURL)
                .field(responder.t('{{server.owner}}'), `<@${guild.ownerID}>`, true)
                .field(responder.t('{{server.ownerID}}'), `\`\`\`${guild.ownerID}\`\`\``, true)
                .field(responder.t('{{server.createDate}}'), `\`\`\`${moment(guild.createdAt).format("LL")}\`\`\``, true)
                .field(responder.t('{{server.channelVoice}}'), responder.t("{{server.channelVoiceSize}}", {
                    channels: guild.channels.filter((c) => c.type === 2).length || "0"
                }), true)
                .field(responder.t('{{server.channelText}}'), responder.t("{{server.channelTextSize}}", {
                    channels: guild.channels.filter((c) => c.type === 0).length || "0"
                }), true)
                .field(responder.t('{{server.createTime}}'), responder.t("{{server.days}}", {
                    days: moment().diff(guild.createdAt, "days") || '0'
                }), true)
                .field(responder.t('{{server.id}}'), `\`\`\`${guild.id}\`\`\``, true)
                .field(responder.t('{{server.locale}}'), `\`\`\`${guild.region}\`\`\``, true)
                .field(responder.t('{{server.botAddDate}}'), `\`\`\`${moment(guild.joinedAt).format("LL")}\`\`\``, true)
                .field(responder.t('{{server.botAddTime}}'), responder.t("{{server.days}}", {
                    days: moment().diff(guild.joinedAt, "days") || '0'
                }), true)
                .field(responder.t('{{server.members}}'), responder.t("{{server.membersSize}}", {
                    members: guild.memberCount || "0"
                }), true)
                .field(responder.t('{{server.roles}}'), responder.t('{{server.rolesSize}}', {
                    roles: guild.roles.size || "0"
                }), true)
                .field(responder.t('{{server.peoples}}'), responder.t('{{server.peoplesSize}}', {
                    peoples: msg.guild.members.filter((m) => !m.bot).length || "0"
                }), true)
                .field(responder.t('{{server.bots}}'), `\`\`\`${msg.guild.members.filter((m) => m.bot).length || "0"} bots\`\`\``, true)
                .thumbnail(`${iconURL}?size=2048`)
                .color(0x00ff00)
        ).send().catch(this.logger.error);
    }
}