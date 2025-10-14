const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const db = require('./db'); // Connexion MySQL
const fs = require('fs');
const etudiantRoutes = require('./routes/etudiant'); // Routes étudiant
const encadreurRoutes = require('./routes/encadreur');
const adminRoutes = require('./routes/admin');
const memoireRoutes = require('./routes/memoire');
const configurationRoutes = require('./routes/configuration');
const utilisateurRoutes = require('./routes/utilisateur');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Autorise les requêtes cross-origin (utile pour Angular)
app.use(express.json()); // Parse le JSON des requêtes
app.use(express.urlencoded({ extended: true }));

// 📂 Fichiers statiques (PDF mémoires)
app.use('/uploads/memoires', express.static(path.join(__dirname, 'uploads/memoires')));
//montages de Routes
app.use('/api/etudiants', etudiantRoutes);
app.use('/api/encadreurs', encadreurRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api/config', configurationRoutes);
app.use('/api/utilisateur', utilisateurRoutes);
console.log('Routes mémoire montées ✅');

// 🔍 Route de test simple
app.get('/test-route', (req, res) => {
  res.send('Route test OK ✅');
});
app.get('/api/memoires/test-direct', (req, res) => {
  res.json({ message: 'Route directe fonctionne ✅' });
});
app.use('/api/memoires', memoireRoutes);
console.log('✅ Routes /api/memoires montées');
// Test de la connexion DB (optionnel)
app.get('/api/ping', (req, res) => {
  db.query('SELECT 1', (err) => {
    if (err) return res.status(500).json({ message: 'Base de données inaccessible' });
    res.json({ message: 'Serveur et base de données opérationnels ✅' });
  });
});

// 🛠️ Gestion des erreurs serveur
app.use((err, req, res, next) => {
  console.error('Erreur serveur :', err.message);
  res.status(500).json({ message: 'Erreur interne du serveur.' });
});

const logoDir = path.join(__dirname, 'uploads/logos');
if (!fs.existsSync(logoDir)) {
  fs.mkdirSync(logoDir, { recursive: true });
}

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`Serveur backend lancé sur le port ${PORT} 🚀`);
});


