const Command = include("bucket/structures/Command");

module.exports = class Autorole extends Command {
    constructor(...args) {
        super(...args, {
            name: "welcome",
            aliases: [],
            options: { localeKey: "commands" },
        })
    }
    async handle(container, responder) {
        responder.selection(['set', 'get', 'enable', 'disable'], {
            title: "{{welcome.configTitle}}",
            mapFunc: ch => responder.t(`{{welcome.${ch}}}`)
        }).then(arg => arg.length ? this[arg[0]](container, responder) : false)
    }
    async get({msg, store}, responder) {
      if (!store.modules.welcome) {
        responder.error(responder.t("{{welcome.rejectMessageRequest}}"));
        return 0;
      } else {
        responder.format("emoji:info").send(store.modules.welcome.text);
      }
    }
    async set ({ msg, args, store, client }, responder) {
        responder.selection(["edit", "delete"], {
            title: "{{welcome.configure.title}}",
            mapFunc: ch => responder.t(`{{welcome.configure.${ch}}}`)
        }).then(arg => arg.length ? this[arg[0]]({ msg, args, store, client}, responder) : false);
      };
    async enable({msg, store }, responder) {
      if(!store.modules.welcome.channel) {
        responder.error("{{welcome.configure.enable.rejection}}");
        return 0;
      };
      const inframodules = store.modules.welcome;
      inframodules.channel = msg.channel.id;
      store.update({ "inframodules": inframodules });
      store.cache().save().then(() => {
        store.save();
        responder.success("{{welcome.configure.enable.success}}");
        return 1;
      });
    }
    async disable({msg, store}, responder) {
        if(!store.modules.welcome) {
          responder.error("{{welcome.configure.disable.rejection}}");
          return 0;
        };
        const inframodules = store.modules.welcome;
        inframodules.channel = null;
        store.update({ "inframodules": inframodules });
        store.cache().save().then(() => {
          store.save();
          responder.success("{{welcome.configure.disable.success}}");
          return 1;
        });
    }
    async edit ({ msg, args, store, client }, responder) {
      responder.format("emoji:info").dialog([{ prompt:responder.t("{{welcome.configure.edit_prompt.typerequest}}", { user: msg.author.id }), input: {type: "string", name: "text"}}]).then(args => {
       const text = args.text;
        if(text.length < 5) {
          responder.error(responder.t("{{welcome.configure.edit_prompt.lessThan}}"));
          return 0;
        };
        if(text.length > 1500) {
          responder.error(responder.t("{{welcome.configure.edit_prompt.higherThan}}"));
          return 0;
        };
       if(!store.modules.welcome) {
         store.update({ "modules.welcome": { "channel": msg.channel.id, "text": text  }  });
         store.save().then(() => {
           responder.success(responder.t("{{welcome.configure.edit_prompt.success}}"));
           return 1;
         })
       } else {
         const inframodules = store.modules.welcome
         inframodules.text = text;
         store.cache().update({ "modules.welcome": inframodules });
         store.cache().save().then(() => {
           responder.success(responder.t("{{welcome.configure.edit_prompt.success}}"));
           return 1;
         })
       }
      })
    }
    async delete({store}, responder) {
      let inframodules = store.modules.welcome;
      if (!inframodules) {
        responder.error(responder.t("{{welcome.configure.delete_prompt.reject}}"));
        return 0;
      }
      inframodules = {};
      store.update({ "modules.welcome": inframodules });
      store.cache().save().then(() => {
        store.save();
        responder.success(responder.t("{{welcome.configure.delete_prompt.success}}"));
        return 1;
      })
    }
}