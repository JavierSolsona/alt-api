'use strict';
module.exports = (sequelize, DataTypes) => {
  const Subcategory = sequelize.define('Subcategory', {
    name: DataTypes.STRING,
    image: DataTypes.STRING
  }, {});
  Subcategory.associate = function(models) {
    models.Subcategory.belongsTo(models.Category)
    models.Subcategory.hasMany(models.Product)
  };
  return Subcategory;
};