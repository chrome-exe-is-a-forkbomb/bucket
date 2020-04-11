const { Command } = include('bucket/index')

module.exports = class RemoveRoleAll extends Command {
    constructor(...args) {
        super(...args, {
            name: 'removeRoleAll',
            group: 'moderation',
            aliases: ['removera', 'rra'],
            cooldown: 5,
            description: 'Remove one role of all',
            options: {
                guildOnly: true,
                localeKey: "commands",
                permissions: ['manageRoles']
            },
            usage: [{
                name: 'role',
                displayName: 'id/mention/name',
                type: 'role',
                optional: false
            }]
        })
    }

    async handle({ args, msg, client }, responder) {
        const role = args.role[0];
        const memberLength = msg.guild.memberCount

        const msg_responder = await msg.channel.createMessage(`Remover role de \`\`${memberLength}\`\` membros`)
        let success = 0
        let error = 0

        msg.guild.members.map(member => {
            member.removeRole(role.id, "Command remove role all")
                .then(() => {
                    msg_responder.edit(`Removido de \`\`${++success}/${memberLength}\`\` membros, erros em \`\`${error}\`\` membros`)
                })
                .catch(() => {
                    msg_responder.edit(`Removido de \`\`${success}/${memberLength}\`\` membros, erros em \`\`${++error}\`\` membros`)
                })
        })
    };
}