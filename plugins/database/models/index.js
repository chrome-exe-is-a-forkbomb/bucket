'use strict';

const fs = require('fs');
const { join, basename } = require('path');
const Sequelize = require('sequelize');
const config = require(__dirname + '/../config/config.json')["production"];
const db = {};

const Redis = require('ioredis')
const redis = new Redis()
const RedisAdaptor = require('sequelize-transparent-cache-ioredis')
const redisAdaptor = new RedisAdaptor({
  client: redis,
  namespace: 'model',
  lifetime: 60*60
})
const sequelizeCache = require('sequelize-transparent-cache')
const { withCache } = sequelizeCache(redisAdaptor)

const { DBNAME, USERNAMES, PASSWORD } = process.env

const sequelize = new Sequelize(
  DBNAME,
  USERNAMES,
  PASSWORD,
  config);

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename(__filename)) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = withCache(sequelize['import'](join(__dirname, file)));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

sequelize.sync();

module.exports = db;