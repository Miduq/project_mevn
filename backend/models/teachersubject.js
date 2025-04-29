// backend/models/teachersubject.js

'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TeacherSubject extends Model {
    static associate(models) {
      TeacherSubject.belongsTo(models.User, {
        foreignKey: 'id_teacher',
        as: 'teacher',
      });
      TeacherSubject.belongsTo(models.Subject, {
        foreignKey: 'id_subject',
        as: 'subject',
      });
    }
  }
  TeacherSubject.init(
    {
      id_teacher: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      id_subject: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'subjects',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      modelName: 'TeacherSubject',
      tableName: 'teachers_subjects',
      timestamps: false,
    }
  );
  return TeacherSubject;
};
