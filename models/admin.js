const { DataTypes } = require("sequelize");
const { sequelize } = require(".");

module.exports = (sequelize, DataTypes) =>{
    const User = sequelize.define("User", {
        name: { type: Sequelize.STRING, allowNull: false },
        email: { type: Sequelize.STRING, unique: true, allowNull: false },
        password: { type: Sequelize.STRING, allowNull: false },
        role: { type: Sequelize.STRING, defaultValue: "user" } // 'user' or 'admin'
      });
      return 
}
  