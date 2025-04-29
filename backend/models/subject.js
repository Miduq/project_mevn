// backend/models/subject.js

'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Subject extends Model {
    static associate(models) {
      // Relacionamos con la tabla 'students_teachers_relation'
      Subject.hasMany(models.Students_teachers_relation, {
        foreignKey: 'id_subject',
        as: 'teacherStudentRelation',
      });

      // Relacionamos con la tabla 'teachers_subjects'
      Subject.belongsToMany(models.User, {
        through: models.TeacherSubject,
        foreignKey: 'id_subject',
        otherKey: 'id_teacher',
        as: 'teachers',
      });
    }
  }

  Subject.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      subject: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: 'Subject',
      tableName: 'subjects',
      timestamps: false,
    }
  );

  return Subject;
};
