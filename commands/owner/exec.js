const { exec } = require('child_process')
const { Command } = include("bucket/index");

module.exports = class ExecCommand extends Command {
    constructor(...args) {
        super(...args, {
            name: 'exec',
            group: 'owner',
            aliases:[],
            cooldown: 0,
            description: 'Executes a shell command',
            options: {
                guildOnly: true,
                adminOnly: true
            },
            usage: [
                { name: 'exec', type: 'string', optional: false, last: true }
            ]
        })
    }

    exec(command) {
        return new Promise((resolve, reject) => {
            exec(command, (err, stdout, stderr) => {
                if (err) return reject(err)
                return resolve(stdout || stderr)
            })
        })
    }

    async handle({ args }, responder) {
        const cmd = args.exec
        let result
        try {
            result = await this.exec(cmd)
        } catch (err) {
            result = err
        }
        responder.format('code:js').send(result || 'No result')
    }
}