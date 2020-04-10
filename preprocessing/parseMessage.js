module.exports = {
    name: 'parseMessage',
    priority: 1,
    process: async container => {
      const { msg, client, commands } = container;
      if(!msg.channel.guild) return
      const db = client.plugins.get("store");
      const store = await db.fetchGuild(msg.channel.guild.id);
      
      const prefix = store.settings.prefix;
      const language = store.settings.locale;
  
      if (!msg.content.startsWith(prefix)) return;
  
      const rawArgs = msg.content.substring(prefix.length).split(' ');
      container.trigger = rawArgs[0].toLowerCase();
      container.isCommand = commands.has(container.trigger);
      container.rawArgs = rawArgs.slice(1).filter(v => v);
      container.store = store;
      container.settings = { lang: language, prefix }
      return Promise.resolve(container);
    }
  }