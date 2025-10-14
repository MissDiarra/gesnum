// Exemple pour routes/memoire.js
const express = require('express');
const router = express.Router();
const memoireController = require('../controllers/memoireController');
const db = require('../db');
const { verifyToken, hasAnyRole, hasRole } = require('../middleware/auth');
console.log('📂 Fichier memoire.js chargé ✅');

// Route test
// Récupérer tous les mémoires
router.get('/', memoireController.listerMemoires);
//ajouter un mémoire (avec fichier)
router.post('/ajouter', memoireController.ajouterMemoire);
// 🧺 Lister les mémoires en corbeille
router.get('/corbeille', memoireController.listerCorbeille);
// 📁 Lister les archives
//router.get('/archives', memoireController.listerArchives);
// 📊 Statistiques globales
router.get('/statistiques-memoires', memoireController.getStatistiques);
//mise en corbeille un mémoire par ID
router.put('/:id/corbeille', memoireController.deplacerVersCorbeille);
// Archiver un mémoire
router.put('/:id/archiver', memoireController.archiverMemoire);
// 🔁 Restaurer un mémoire
router.put('/:id/restaurer', memoireController.restaurerMemoire);
// 📝 Modifier un mémoire
router.put('/:id', memoireController.modifierMemoire);
// ❌ Supprimer définitivement
router.delete('/:id/supprimer-definitif', memoireController.supprimerDefinitif);


// 🔓 Route publique
router.get('/public', (req, res) => {
  const sql = `
    SELECT 
      m.Id_Mem AS id,
      m.Titre AS titre,
      m.Annee AS annee,
      m.Filiere AS filiere,
      m.Niveau AS niveau,
      m.DocumentUrl AS documentUrl,
      e.nom_etud AS etudiant_nom,
      e.prenom_etud AS etudiant_prenom,
      enc.nom_encad AS encadreur_nom,
      enc.prenom_encad AS encadreur_prenom
    FROM memoire m
    LEFT JOIN etudiant e ON m.Id_Etud = e.Id_Etud
    LEFT JOIN encadreur enc ON m.Id_Encad = enc.Id_Encad 
    WHERE m.Archive = 0 AND m.Corbeille = 0
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Erreur DB' });
     
    const formatted = results.map(row => ({
      id: row.id,
      titre: row.titre,
      annee: row.annee,
      niveau: row.niveau,
      filiere: row.filiere,
      documentUrl: row.documentUrl,
      etudiant: {
        nom: row.etudiant_nom || '',
        prenom: row.etudiant_prenom || ''
      },
      encadreur: {
        Nom_Encad: row.encadreur_nom || '',
        Prenom_Encad: row.encadreur_prenom || ''
      }
    }));

    console.log('Mémoires publics envoyés ✅', formatted);
    res.json(formatted);
  });
});

// 🔐 Route pour utilisateur connecté
router.get('/utilisateur/:id', verifyToken, hasAnyRole('utilisateur', 'admin'), (req, res) => {
  const id = req.params.id;
  db.query('SELECT * FROM memoire WHERE Id_Etud = ? AND Archive = 0', [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Erreur DB' });
    res.json(Array.isArray(results) ? results : []);
  });
});

router.get('/archives', verifyToken, hasRole('admin'), (req, res) => {
  const sql = `
    SELECT 
      m.Id_Mem AS id,
      m.Titre AS titre,
      m.Annee AS annee,
      m.Filiere AS filiere,
      m.Niveau AS niveau,
      m.DocumentUrl AS documentUrl,
      e.nom_etud AS etudiant_nom,
      e.prenom_etud AS etudiant_prenom,
      enc.nom_encad AS encadreur_nom,
      enc.prenom_encad AS encadreur_prenom
    FROM memoire m
    LEFT JOIN etudiant e ON m.Id_Etud = e.Id_Etud
    LEFT JOIN encadreur enc ON m.Id_Encad = enc.Id_Encad
    WHERE m.Archive = 1
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Erreur DB' });
    const formatted = results.map(row => ({
      id: row.id,
      titre: row.titre,
      annee: row.annee,
      niveau: row.niveau,
      filiere: row.filiere,
      documentUrl: row.documentUrl,
      etudiant: {
        nom: row.etudiant_nom || '',
        prenom: row.etudiant_prenom || ''
      },
      encadreur: {
        Nom_Encad: row.encadreur_nom || '',
        Prenom_Encad: row.encadreur_prenom || ''
      }
    }));
    res.json(formatted);
  });
});
router.get('/public/test', (req, res) => {
  res.json({ message: 'Route publique fonctionne ✅' });
});
router.get('/test-kadiatou', (req, res) => {
  res.json({ message: 'Route test Kadiatou fonctionne ✅' });
});
// 📂 Récupérer un mémoire par ID
router.get('/:id', memoireController.getMemoireById);

module.exports = router;