// backend/models/user.js

'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      // Relacionamos con la tabla 'roles'
      User.belongsTo(models.Role, {
        foreignKey: 'rol', // Clave foránea
        as: 'userRole', // Alias para la relación
      });

      // Relacionamos con las relaciones como profesor
      User.hasMany(models.Students_teachers_relation, {
        foreignKey: 'id_teacher',
        as: 'studentsRelations',
      });

      // Relacionamos con las relaciones como estudiante
      User.hasMany(models.Students_teachers_relation, {
        foreignKey: 'id_student',
        as: 'teachersRelations',
      });

      // Relacionamos con la tabla 'subjects' a través de 'teachers_subjects'
      User.belongsToMany(models.Subject, {
        through: models.TeacherSubject,
        foreignKey: 'id_teacher',
        otherKey: 'id_subject',
        as: 'teacherSubjects',
      });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true, // Restricción para que no se duplique el nombre de usuario
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      surname: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { isEmail: true },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      rol: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id',
        },
      },
      access_token: {
        type: DataTypes.STRING(36),
        allowNull: true,
        defaultValue: DataTypes.UUIDV4,
      },
      password_token: {
        type: DataTypes.STRING(36),
        allowNull: true,
        defaultValue: DataTypes.UUIDV4,
      },
      active: {
        type: DataTypes.BOOLEAN, // TinyInt mapeado a booleano
        defaultValue: 0, // Inactivo por defecto
      },
      profile_image: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: false,
    }
  );

  return User;
};
