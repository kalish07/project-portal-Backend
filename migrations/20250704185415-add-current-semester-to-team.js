'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add the current_semester column to Teams table
    await queryInterface.addColumn('Teams', 'current_semester', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 5 // You can change the default value if needed
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the current_semester column from Teams table
    await queryInterface.removeColumn('Teams', 'current_semester');
  }
};

