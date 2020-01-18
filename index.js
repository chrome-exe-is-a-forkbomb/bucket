const Bucket = require('./bucket/Bucket');
const Store = require('./plugins/database/Store');
const { join } = require('path');

require('dotenv').config()

global.include = file => require(join(__dirname, file));

const client = new Bucket({
	token: process.env.TOKEN,
	modules: './modules'
});

const resolve = dir => join(dir);

client.register("commands", resolve('./commands'), { groupedCommands: true });
client.createPlugin('store', Store);

client.run();