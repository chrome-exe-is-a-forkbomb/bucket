'use strict';
module.exports = (sequelize, DataTypes) => {
  const Guild = sequelize.define('Guild', {
    id: { type: DataTypes.STRING, primaryKey: true},
    settings: {type: DataTypes.JSON, defaultValue: {
      locale: "pt-BR",
      prefix: ">",
    }},
    welcome: { type: DataTypes.JSON, defaultValue: {
      text: "Hey, {{username}}. Welcome to the server! Don't know to read the rules and be a good boy. : D",
      channel: null,
      dm: false      
    }},
    leave: { type: DataTypes.JSON, defaultValue: {
      text: "{{username}} left : (",
      channel: null,
      dm: false      
    }},
    filters: { type: DataTypes.JSON, defaultValue: {}},
    boxes: { type: DataTypes.JSON, defaultValue: {}},
    permissions: { type: DataTypes.JSON, defaultValue: {}},
    magicRooms: { type: DataTypes.JSON, defaultValue: {}},
    }, {});
  return Guild;
};