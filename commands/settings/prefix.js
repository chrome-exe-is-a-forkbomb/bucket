const { Command } = require("sylphy");

module.exports = class Prefix extends Command {
    constructor(...args) {
        super(...args, {
            name: "prefix",
            aliases: ["setprefix"],
            options: { localeKey: "commands" },
            usage: [{ name: 'prefix', type: 'string', max: 3, min: 1, optional: false }]
        })
    }
    async handle({ args, store }, responder) {
        if (args.prefix === store.settings.prefix)
            return responder.error(responder.t("{{prefix.same_prefix}}"));
        store.update({ "settings.prefix": args.prefix });
        await store.save().then(() => {
            return responder.send(responder.t("{{prefix.set_prefix}}", {
                prefix: args.prefix
            }));
        });
    };
};