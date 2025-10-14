const mysql = require('mysql2');
const util = require('util');
const dotenv = require('dotenv');

dotenv.config();

// ✅ Connexion via pool + .env
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'ta_base_de_donnees'
});

// ✅ Promisifier pool.query pour utiliser async/await
pool.query = util.promisify(pool.query); // ✅ transforme query en promesse

// ✅ Test de connexion
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Erreur de connexion à MySQL :', err.message);
  } else {
    console.log('Connecté à la base MySQL via pool✅');
    connection.release();
  }
});

module.exports = pool;