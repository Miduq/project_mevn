// role.js

"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Role extends Model {
    static associate(models) {
      Role.hasMany(models.User, {
        foreignKey: "rol", //Clave foránea en la tabla de User
        as: "users", //Alias para la relación
      });
    }
  }

  Role.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: false,
        primaryKey: true,
      },
      role_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: "Role",
      tableName: "roles",
      timestamps: false,
    }
  );

  return Role;
};
