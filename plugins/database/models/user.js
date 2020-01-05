'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.STRING, primaryKey: true},
    premium: { type: DataTypes.JSON, defaultValue: {}},
    blacklisted: { type: DataTypes.JSON, defaultValue: {}},
    profile: { type: DataTypes.JSON, defaultValue: {}},
    balance: { type: DataTypes.BIGINT, defaultValue: 0}
  }, {});
  return User;
};