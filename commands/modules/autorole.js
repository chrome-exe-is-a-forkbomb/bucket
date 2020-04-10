const { Command } = include("bucket/index");

module.exports = class Autorole extends Command {
  constructor(...args) {
    super(...args, {
      name: "autorole",
      aliases: [],
      options: { localeKey: "commands", adminOnly: false },
      usage: [
         { name: 'choice', type: 'string', choices: ['--delete', '--create', '--info'], optional: true },
         { name: 'role', type: 'role', optional: true }
             ]
    })
  }
  async handle({ msg, args, client, store }, responder) {
    switch (args.choice) {
      case '--delete': {

        if (store.modules.autorole == null) return responder.error('{{autorole.deleteRejection}}');

        await store.uptate({ 'modules.autorole': null });
        return responder.send('{{autorole.deletedSuccess}}');
      };
      case '--create': {
        
        if (!args.role) return responder.error(responder.t('{{autorole.missingRole}}'));

        const role = args.role[0];
        const myself = msg.guild.members.get(client.user.id);

        if (role.position > myself.highestRole.position) 
          return responder.error(responder.t('{{autorole.myselfLowRole}}'));
        if (role.managed)
          return responder.error(responder.t('{{autorole.managedError}}'));
        
        await store.update({'modules.autorole': role.id });

        await store.save();

        return responder.success(responder.t('{{autorole.success}}'));

      };
      case '--info': {
        console.log(store);
        if (store.modules.autorole == null) return responder.send('{{autorole.notSet}}');
        else return responder.format('emoji:info').send('{{autorole.getInfo}}', { role: `<@&${store.modules.autorole}>` });
      };
    };
  };
};