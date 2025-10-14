// Exemple pour routes/etudiant.js
const express = require('express');
const db = require('../db');
const router = express.Router();
const verifyToken = require('../middleware/auth');


// Ajouter un encadreur
router.post('/', (req, res) => {
  const { nom, prenom, email, tel, specialite } = req.body;

  if (!nom || !prenom || !email || !tel || !specialite) {
    return res.status(400).json({ message: 'Tous les champs sont requis ❌' });
  }

  //verifier si l'encadreur existe déjà
  const checkSql = 'SELECT * FROM encadreur WHERE Email_Encad = ?';
  db.query(checkSql, [email], (err, rows) => {
    if (err) {
      console.error('Erreur SQL (vérification) :', err);
      return res.status(500).json({ message: 'Erreur lors de la vérification du doublon' });
    }

    if (rows.length > 0) {
      return res.status(409).json({ message: 'Encadreur déjà existant ❌' });
    }    
    // Si pas de doublon, on insère
    const insertSql = `
      INSERT INTO encadreur (Nom_Encad, Prenom_Encad, Email_Encad, Tel_Encad, Specialite)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(insertSql, [nom, prenom, email, tel, specialite], (err, result) => {
      if (err) {
        console.error('Erreur SQL (insertion) :', err);
        return res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'encadreur' });
      }
      res.status(201).json({ message: 'Encadreur ajouté avec succès ✅', id: result.insertId });
    });
  });
});

// Modifier un encadreur
router.put('/:id', (req, res) => {
  const { nom, prenom, email, tel, specialite } = req.body;
  const id = req.params.id;

  if (!nom || !prenom || !email || !tel || !specialite) {
    return res.status(400).json({ message: 'Tous les champs sont requis ❌' });
  }

  const updateSql = `
    UPDATE encadreur
    SET Nom_Encad = ?, Prenom_Encad = ?, Email_Encad = ?, Tel_Encad = ?, Specialite = ?
    WHERE Id_Encad = ?
  `;
  db.query(updateSql, [nom, prenom, email, tel, specialite, id], (err, result) => {
    if (err) {
      console.error('Erreur SQL (modification) :', err);
      return res.status(500).json({ message: 'Erreur lors de la modification' });
    }
    res.status(200).json({ message: 'Encadreur modifié avec succès ✅' });
  });
});

// Récupérer tous les encadreurs
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM encadreur';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur SQL :', err);
      return res.status(500).json({ message: 'Erreur lors de la récupération des encadreurs'});
    }
    res.status(200).json(results);
  });
  //res.send('Route encadreur OK');
  //res.status(200).json({ message: 'Route encadreur OK ✅' });
});

// Exemple de route protégée
/*router.get('/profil', verifyToken, (req, res) => {
    res.status(200).json({
        message: 'Accès autorisé au profil',
        user: req.user // contient Id_Etud et Matricule
    });
}); */

module.exports = router;
