// Exemple pour routes/etudiant.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { verifyToken, hasRole, hasAnyRole } = require('../middleware/auth');


dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY || 'memoire_secret_2025';

router.post('/login', (req, res) => {
  const { Email_Admin, Mot_passe_Admin } = req.body;

  if (!Email_Admin || !Mot_passe_Admin) {
    return res.status(400).json({ message: 'Email et mot de passe requis. '});
  }

  const sql = 'SELECT * FROM admin WHERE Email_Admin = ?';
  db.query(sql, [Email_Admin], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Erreur serveur.' });
    if (results.length === 0) return res.status(401).json({ message: 'Admin non trouvé.' });

    const admin = results[0];
    const isMatch = await bcrypt.compare(Mot_passe_Admin, admin.Mot_passe_Admin);
    if (!isMatch) return res.status(401).json({ message: 'Mot de passe incorrec.'});

    const token = jwt.sign(
      {
        Id_Admin: admin.Id_Admin,
        Email_Admin: admin.Email_Admin,
        role: 'admin'
      },
      SECRET_KEY,
      { expiresIn: '2h'}
    );

    res.status(200).json({
      message: 'Connexion admin réusie.',
      token,
      admin: {
        Id_Admin: admin.Id_Admin,
        Nom_Admin: admin.Nom_Admin,
        Email_Admin: admin.Email_Admin
      }
    });
  });
});

router.get('/utilisateurs', verifyToken, hasRole('admin'), (req, res) => {
  db.query('SELECT * FROM utilisateur', (err, results) => {
    if (err) return res.status(500).json({ message: 'Erreur DB' });
    res.json(results);
  });
});

router.post('/utilisateurs', (req, res) => {
  const { nom, email, role } = req.body;

  if (!nom || !email || !role) {
    return res.status(400).json({ message: 'Champs requis manquants.' });
  }

  db.query(
    'INSERT INTO utilisateurs (nom, email, role) VALUES (?, ?, ?)',
    [nom, email, role],
    (err) => {
      if (err) return res.status(500).json({ message: 'Erreur DB' });
      res.json({ message: 'Utilisateur ajouté ✅' });
    }
  );
});

router.put('/utilisateurs/:id', (req, res) => {
  const { nom, email, role } = req.body;

  db.query(
    'UPDATE utilisateurs SET nom = ?, email = ?, role = ? WHERE id = ?',
    [nom, email, role, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ message: 'Erreur DB' });
      res.json({ message: 'Utilisateur modifié ✅' });
    }
  );
});

router.delete('/utilisateurs/:id', (req, res) => {
  db.query('DELETE FROM utilisateurs WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Erreur DB' });
    res.json({ message: 'Utilisateur supprimé ✅' });
  });
});



module.exports = router;
