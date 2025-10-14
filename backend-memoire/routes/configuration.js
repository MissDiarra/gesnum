const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// 📁 Configuration upload logo
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/logos'),
  filename: (req, file, cb) => cb(null, 'logo-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// 🔍 GET paramètres
router.get('/parametres-generaux', (req, res) => {
  db.query('SELECT * FROM parametres_generaux LIMIT 1', (err, results) => {
    if (err) return res.status(500).json({ message: 'Erreur DB', error: err });
    res.json(results[0]);
  });
});

/// 💾 PUT mise à jour
router.put('/parametres-generaux', (req, res) => {
  console.log('PUT reçu :', req.body);
  const { Nom_Etab, An_Academie, Langue, Notifications, Theme, Mode_Maintenance } = req.body;
  db.query(
    `UPDATE parametres_generaux SET Nom_Etab = ?, An_Academie = ?, Langue = ?, Notifications = ?, Theme = ?, Mode_Maintenance = ? WHERE id = 1`,
    [Nom_Etab, An_Academie, Langue, Notifications, Theme, Mode_Maintenance],
    (err) => {
      if (err) return res.status(500).json({ message: 'Erreur DB', error: err });
      res.json({ message: 'Paramètres mis à jour ✅' });
    }
  );
});

// 🖼️ POST logo
router.post('/parametres-generaux/Logo', upload.single('logo'), (req, res) => {
  console.log('Fichier reçu :', req.file);

  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier reçu' });
  }
  
  const logoPath = '/uploads/logos/' + req.file.filename;
  db.query(`UPDATE parametres_generaux SET Logo = ? WHERE id = 1`, [logoPath], (err) => {
    if (err) return res.status(500).json({ message: 'Erreur DB', error: err });
    res.json({ message: 'Logo mis à jour ✅', logo: logoPath });
  });
});

module.exports = router;
