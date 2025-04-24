"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("teachers_subjects", {
      id_teacher: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true, // <-- Parte de la clave primaria compuesta
        references: {
          model: "users", // <-- Referencia a la tabla 'users'
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // <-- Si se borra el User (profesor), se borra esta relación
      },
      id_subject: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true, // <-- Parte de la clave primaria compuesta
        references: {
          model: "subjects", // <-- Referencia a la tabla 'subjects'
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // <-- Si se borra el Subject, se borra esta relación
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("teachers_subjects");
  },
};
