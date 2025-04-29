// backend/models/students_teachers_relation.js

'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Students_teachers_relation extends Model {
    static associate(models) {
      //Relacion con la tabla 'roles'
      Students_teachers_relation.belongsTo(models.User, {
        foreignKey: 'id_student', //Clave foránea
        as: 'student', //Alias para la relación
      });
      Students_teachers_relation.belongsTo(models.User, {
        foreignKey: 'id_teacher', //Clave foránea
        as: 'teacher', //Alias para la relación
      });
      Students_teachers_relation.belongsTo(models.Subject, {
        foreignKey: 'id_subject', //Clave foránea
        as: 'subject', //Alias para la relación
      });
    }
  }

  Students_teachers_relation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      id_student: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users', //tabla referenciada
          key: 'id',
        },
      },
      id_teacher: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users', //tabla referenciada
          key: 'id',
        },
      },
      id_subject: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'subjects', //tabla referenciada
          key: 'id',
        },
      },
    },
    {
      sequelize,
      modelName: 'Students_teachers_relation',
      tableName: 'students_teachers_relation',
      timestamps: false,
    }
  );

  return Students_teachers_relation;
};
