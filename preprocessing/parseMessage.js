module.exports = {
  name: 'parseMessage',
  priority: 1,
  process: async container => {
    const { msg, client, commands, plugins } = container;
    if (!msg.channel.guild) return
    const db = plugins.get("store");
    const store = await db.fetchGuild(msg.channel.guild.id);

    const prefix = store.settings.prefix;
    const language = store.settings.locale;

    if (msg.content.startsWith(`<@!${client.user.id}>`)) {
      const i18n = plugins.get("i18n")
      const tradution = i18n.parse("{{botMention}}", "commands", language, { prefix })
      
      return msg.channel.createMessage(tradution)
    }

    else if (!msg.content.startsWith(prefix)) return;

    const rawArgs = msg.content.substring(prefix.length).split(' ');
    container.trigger = rawArgs[0].toLowerCase();
    container.isCommand = commands.has(container.trigger);
    container.rawArgs = rawArgs.slice(1).filter(v => v);
    container.store = store;
    container.settings = { lang: language, prefix }
    return Promise.resolve(container);
  }
}