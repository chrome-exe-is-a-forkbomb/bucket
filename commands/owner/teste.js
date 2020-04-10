const { Command } = include("bucket/index");

module.exports = class Avatar extends Command {
  constructor(...args) {
    super(...args, {
      name: "teste",
      aliases: ["tt"],
      options: { localeKey: "commands", adminOnly: true },
    })
  }
  async handle({ msg, rawArgs, client }, responder) {
    console.log(1);
  }
}