'use strict';

const fs = require('fs');
const {join, basename} = require('path');
const Sequelize = require('sequelize');
const config = require(__dirname + '/../config/config.json')["production"];
const db = {};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config);

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename(__filename)) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = sequelize['import'](join(__dirname, file));
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