const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`\n✅ MongoDB Connected Successfully`);
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`📂 Database: ${conn.connection.name}\n`);

    return conn;
  } catch (error) {
    console.error(`\n❌ MongoDB Connection Failed`);
    console.error(`Error: ${error.message}\n`);
    process.exit(1);
  }
};

module.exports = connectDB;
