// session.js

'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Session extends Model {
    static associate(models) {
      Session.belongsTo(models.User, {
        foreignKey: 'id_user', //Clave foránea en la tabla de User
        as: 'user', //Alias para la relación
      });
    }
  }

  Session.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      id_user: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      signed_in: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW, // Asigna la fecha y hora actual por defecto
      },
    },
    {
      sequelize,
      modelName: 'Session',
      tableName: 'session',
      timestamps: false,
    }
  );

  return Session;
};
