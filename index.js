const Bucket = require('./bucket/Bucket');
const Store = require('./plugins/database/Store');
const { join } = require('path');

require('dotenv').config()

global.include = file => require(join(__dirname, file));

const client = new Bucket({
	token: process.env.TOKEN,
	modules: './modules',
	admins: ['694538239507300463', '268351613771448320']
});

client.register("commands", join('./commands'), { groupedCommands: true });
client.createPlugin('store', Store);

client.run();
