const Bucket = require('./bucket/Bucket');  
const Store  = require('./plugins/database/Store');
const path = require('path');

const client = new Bucket({
  token: 'TOKEN GOES HERE',
  modules: './modules'
});

const resolve = (dir) => path.join(dir);

client.register("commands", resolve('./commands'), { groupedCommands: true });
client.createPlugin('store', Store);

client.run();