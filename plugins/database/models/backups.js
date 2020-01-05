'use strict';
module.exports = (sequelize, DataTypes) => {
  const Backups = sequelize.define('Backups', {
    key: { type: DataTypes.STRING, primaryKey: true},
    content: { type: DataTypes.JSON, defaultValue: {}},
  }, {});

  return Backups;
};