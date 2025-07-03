
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const Product = require('../../models/product');
const dbConnection = require('../../config/connectDB');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

dbConnection();

const filePath = path.join(__dirname, 'product.json');
const products = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

const insertData = async () => {
  try {
    await Product.create(products);
    console.log('Data Inserted'.green.inverse);
    process.exit();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Product.deleteMany();
    console.log('Data Destroyed'.red.inverse);
    process.exit();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

if (process.argv[2] === '-i') {
  insertData();
} else if (process.argv[2] === '-d') {
  destroyData();
}
