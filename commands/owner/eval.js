const { Command } = include("bucket/index");

module.exports = class EvalCommand extends Command {
  constructor(...args) {
    super(...args, {
      name: 'eval',
      group: 'owner',
      aliases:[],
      cooldown: 0,
      description: 'Executes a shell command',
      options: {
        guildOnly: true,
        adminOnly: true
      },
      usage: [
        { name: 'eval', displayName: 'eval', type: 'string', optional: false, last: true }
      ]
    });
  }

  async handle({ args, client, msg, store }, responder) {
    let suffix, evaled;

    const cleanCodeBlock = (string) => {
      return string.replace(/^```.* ?/, '').replace(/```$/, '');
    };

    try {
      suffix = cleanCodeBlock(args.eval);
      evaled = eval(suffix);
    } catch (err) {
      return responder.send(
        '__**Input:**__\n```js\n' + evaled + '```\n' +
        '__**Error:**__\n```diff\n- ' + err + '```'
      );
    }

    if (typeof evaled === 'object') {
      evaled = JSON.stringify(evaled);
    }

    return responder.send(
      '__**Input:**__\n```js\n' + suffix + '```\n' +
      '__**Result:**__\n```' + evaled + '```'
    );
  }
}