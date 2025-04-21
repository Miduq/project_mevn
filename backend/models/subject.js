// subject.js

'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Subject extends Model {
        static associate(models) {
            Subject.hasMany(models.Students_teachers_relation, {
                foreignKey: 'id_subject', //Clave foránea en la tabla de User
                as: 'teacherStudentRelation', //Alias para la relación
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
            timestamps: false
        }
    );

    return Subject;
};