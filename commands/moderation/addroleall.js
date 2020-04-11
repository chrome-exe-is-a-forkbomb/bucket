const { Command } = include('bucket/index')

module.exports = class AddRoleAll extends Command {
    constructor(...args) {
        super(...args, {
            name: 'addRoleAll',
            group: 'moderation',
            aliases: ['addra', 'ara'],
            cooldown: 5,
            description: 'From one role to all',
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
        const msg_responder = await msg.channel.createMessage(`Adicionando role para \`\`${memberLength}\`\` membros`)
        let success = 0,
            error = 0
        msg.guild.members.map(member => {
            member.addRole(role.id, "Command role all")
                .then(() => {
                    msg_responder.edit(`Adicionado para \`\`${++success}/${memberLength}\`\` membros, erros em \`\`${error}\`\` membros`)
                })
                .catch(() => {
                    msg_responder.edit(`Adicionado para \`\`${success}/${memberLength}\`\` membros, erros em \`\`${++error}\`\` membros`)
                })
        })
    };
}