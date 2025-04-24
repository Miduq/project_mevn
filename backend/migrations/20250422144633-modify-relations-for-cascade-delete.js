"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Usamos una transacción para asegurar que todo se aplica o nada
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log(
        "Modificando FKs de 'students_teachers_relation' para añadir ON DELETE CASCADE..."
      );

      // --- 1. Eliminar las restricciones existentes ---
      // Usamos los nombres exactos que nos dio tu consulta SQL
      console.log(
        "Eliminando constraint: students_teachers_relation_id_student_fkey"
      );
      await queryInterface.removeConstraint(
        "students_teachers_relation",
        "students_teachers_relation_id_student_fkey",
        { transaction }
      );

      console.log(
        "Eliminando constraint: students_teachers_relation_id_teacher_fkey"
      );
      await queryInterface.removeConstraint(
        "students_teachers_relation",
        "students_teachers_relation_id_teacher_fkey",
        { transaction }
      );

      console.log(
        "Eliminando constraint: students_teachers_relation_id_subject_fkey"
      );
      await queryInterface.removeConstraint(
        "students_teachers_relation",
        "students_teachers_relation_id_subject_fkey",
        { transaction }
      );
      console.log("Constraints existentes eliminados.");

      // --- 2. Volver a añadir las restricciones con CASCADE ---
      console.log("Añadiendo nuevas constraints con CASCADE...");
      await queryInterface.addConstraint("students_teachers_relation", {
        fields: ["id_student"], // Columna en esta tabla
        type: "foreign key",
        name: "students_teachers_relation_id_student_fkey", // Podemos reusar el nombre o poner uno nuevo
        references: {
          table: "users", // Tabla referenciada
          field: "id", // Columna referenciada
        },
        onDelete: "CASCADE", // <-- ¡La opción clave!
        onUpdate: "CASCADE", // Buena práctica
        transaction,
      });

      await queryInterface.addConstraint("students_teachers_relation", {
        fields: ["id_teacher"],
        type: "foreign key",
        name: "students_teachers_relation_id_teacher_fkey",
        references: { table: "users", field: "id" },
        onDelete: "CASCADE", // <-- ¡La opción clave!
        onUpdate: "CASCADE",
        transaction,
      });

      await queryInterface.addConstraint("students_teachers_relation", {
        fields: ["id_subject"],
        type: "foreign key",
        name: "students_teachers_relation_id_subject_fkey",
        references: { table: "subjects", field: "id" },
        onDelete: "CASCADE", // <-- ¡La opción clave! (También borra relación si se borra la asignatura)
        onUpdate: "CASCADE",
        transaction,
      });
      console.log("Nuevas constraints con CASCADE añadidas.");

      // Si todo fue bien, confirma la transacción
      await transaction.commit();
      console.log("Migración CASCADE aplicada con éxito.");
    } catch (error) {
      // Si algo falla, revierte la transacción
      console.error("Error aplicando migración CASCADE:", error);
      await transaction.rollback();
      throw error; // Lanza el error para que Sequelize sepa que falló
    }
  },

  async down(queryInterface, Sequelize) {
    // Esto revierte los cambios hechos por 'up'
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log(
        "Revirtiendo constraints CASCADE para 'students_teachers_relation'..."
      );

      // 1. Eliminar las restricciones CASCADE que añadimos en 'up'
      console.log(
        "Eliminando constraint CASCADE: students_teachers_relation_id_student_fkey"
      );
      await queryInterface.removeConstraint(
        "students_teachers_relation",
        "students_teachers_relation_id_student_fkey",
        { transaction }
      ); // Asume que reusamos el nombre

      console.log(
        "Eliminando constraint CASCADE: students_teachers_relation_id_teacher_fkey"
      );
      await queryInterface.removeConstraint(
        "students_teachers_relation",
        "students_teachers_relation_id_teacher_fkey",
        { transaction }
      );

      console.log(
        "Eliminando constraint CASCADE: students_teachers_relation_id_subject_fkey"
      );
      await queryInterface.removeConstraint(
        "students_teachers_relation",
        "students_teachers_relation_id_subject_fkey",
        { transaction }
      );
      console.log("Constraints CASCADE eliminados.");

      // 2. Volver a añadir las restricciones originales (NO ACTION / RESTRICT)
      // Nota: El comportamiento por defecto en PostgreSQL si no especificas onDelete es NO ACTION.
      console.log("Re-añadiendo constraints originales (NO ACTION)...");
      await queryInterface.addConstraint("students_teachers_relation", {
        fields: ["id_student"],
        type: "foreign key",
        name: "students_teachers_relation_id_student_fkey",
        references: { table: "users", field: "id" },
        onDelete: "NO ACTION", // <-- Valor original/por defecto
        onUpdate: "CASCADE", // O el que tuvieras originalmente
        transaction,
      });
      await queryInterface.addConstraint("students_teachers_relation", {
        fields: ["id_teacher"],
        type: "foreign key",
        name: "students_teachers_relation_id_teacher_fkey",
        references: { table: "users", field: "id" },
        onDelete: "NO ACTION",
        onUpdate: "CASCADE",
        transaction,
      });
      await queryInterface.addConstraint("students_teachers_relation", {
        fields: ["id_subject"],
        type: "foreign key",
        name: "students_teachers_relation_id_subject_fkey",
        references: { table: "subjects", field: "id" },
        onDelete: "NO ACTION",
        onUpdate: "CASCADE",
        transaction,
      });
      console.log("Constraints originales restaurados.");

      await transaction.commit();
      console.log("Reversión de migración CASCADE completada.");
    } catch (error) {
      console.error("Error revirtiendo migración CASCADE:", error);
      await transaction.rollback();
      throw error;
    }
  },
};
