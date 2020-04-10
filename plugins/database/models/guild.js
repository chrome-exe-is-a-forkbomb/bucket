'use strict';
module.exports = (sequelize, DataTypes) => {
  const Guild = sequelize.define('Guild', {
    id: { type: DataTypes.STRING, primaryKey: true},
    settings: {type: DataTypes.JSON, defaultValue: {
      locale: "pt-BR",
      prefix: "-",
    }},
    modules: { type: DataTypes.JSON, defaultValue: {} },
    filters: { type: DataTypes.JSON, defaultValue: {}},
    boxes: { type: DataTypes.JSON, defaultValue: {}},
    permissions: { type: DataTypes.JSON, defaultValue: {}},
    magicRooms: { type: DataTypes.JSON, defaultValue: {}},
    }, {});
  return Guild;
};