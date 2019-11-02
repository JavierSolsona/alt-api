'use strict';
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    image: DataTypes.STRING,
    file: DataTypes.STRING
  }, {});
  Product.associate = function(models) {
    models.Product.belongsTo(models.Subcategory)
  };
  return Product;
};