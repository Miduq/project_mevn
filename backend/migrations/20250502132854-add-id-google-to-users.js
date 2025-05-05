'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Añadimos la columna 'google_id' a la tabla 'users'
    await queryInterface.addColumn(
      'users', // Nombre de la tabla
      'id_google', // Nombre de la nueva columna
      {
        type: Sequelize.STRING, // El ID de Google es un string largo
        allowNull: true, // Debe permitir nulos (usuarios con login normal no lo tendrán)
        unique: true, // El ID de Google debe ser único por usuario
      }
    );
    // Opcional: Añadir un índice para búsquedas más rápidas por google_id
    await queryInterface.addIndex('users', ['id_google']);
  },

  async down(queryInterface, Sequelize) {
    // Eliminar el índice primero si lo añadiste
    await queryInterface.removeIndex('users', ['id_google']);
    // Eliminar la columna 'google_id' de la tabla 'users'
    await queryInterface.removeColumn('users', 'id_google');
  },
};
