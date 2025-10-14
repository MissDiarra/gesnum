const express = require('express');
const router = express.Router();
const db = require('../db'); // Connexion à MySQL
const bcrypt = require('bcryptjs'); // Pour le hachage du mot de passe
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { verifyToken, hasRole, hasAnyRole } = require('../middleware/auth'); // Middleware JWT

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY || 'memoire_secret_2025';

// =======================
// 🔐 Route POST : Ajouter un étudiant
// =======================
router.post('/', async (req, res) => {
    const { Matricule, Nom_Etud, Prenom_Etud, Sexe, Tel_Etud, Adress_Etud, Classe, Filiere, Mot_passe_Etud } = req.body;

    if (!Matricule || !Nom_Etud || !Prenom_Etud || !Mot_passe_Etud) {
        return res.status(400).json({ message: 'Champs obligatoires manquants.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(Mot_passe_Etud, salt);

        console.log('Valeurs envoyées à SQL :', {
            Matricule,
            Nom_Etud,
            Prenom_Etud,
            Sexe,
            Tel_Etud,
            Adress_Etud,
            Classe,
            Filiere,
            Mot_passe_Etud
        });

        console.log('Ordre des valeurs insérées :', [
            Matricule,
            Nom_Etud,
            Prenom_Etud,
            Sexe,
            Tel_Etud,
            Adress_Etud,
            Classe,
            Filiere,
            hashedPassword
        ]);
        console.log('Valeur Sexe avant insertion :', Sexe);


        const sql = `
            INSERT INTO etudiant (Matricule, Nom_Etud, Prenom_Etud, Sexe, Tel_Etud, Adress_Etud, Classe, Filiere, Mot_passe_Etud)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [Matricule, Nom_Etud, Prenom_Etud, Sexe, Tel_Etud, Adress_Etud, Classe, Filiere, hashedPassword], (err, result) => {
            if (err) {
                console.error('Erreur lors de l\'insertion :', err);
                return res.status(500).json({ message: 'Erreur serveur.' });
            }
            console.log('Insertion réussie, ID étudiant :', result.insertId);
            res.status(201).json({ message: 'Étudiant ajouté avec succès.', Id_Etud: result.insertId });
        });
    } catch (error) {
        console.error('Erreur lors du hachage du mot de passe :', error);
        res.status(500).json({ message: 'Erreur serveur lors du traitement du mot de passe.' });
    }
});

// =======================
// 🔐 Route POST : Connexion étudiant
// =======================
router.post('/login', (req, res) => {
    const { Matricule, Mot_passe_Etud } = req.body;

    if (!Matricule || !Mot_passe_Etud) {
        return res.status(400).json({ message: 'Matricule et mot de passe requis.' });
    }

    const sql = 'SELECT * FROM etudiant WHERE Matricule = ?';
    db.query(sql, [Matricule], async (err, results) => {
        if (err) {
            console.error('Erreur lors de la recherche :', err);
            return res.status(500).json({ message: 'Erreur serveur.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'Étudiant non trouvé.' });
        }

        const etudiant = results[0];
        const isMatch = await bcrypt.compare(Mot_passe_Etud, etudiant.Mot_passe_Etud);

        if (!isMatch) {
            return res.status(401).json({ message: 'Mot de passe incorrect.' });
        }

        const token = jwt.sign(
            {
              Id_Etud: etudiant.Id_Etud,
              Matricule: etudiant.Matricule,
              role: 'etudiant'
            },
            SECRET_KEY,
            { expiresIn: '2h' }
        );

        res.status(200).json({
            message: 'Connexion réussie.',
            token,
            etudiant: {
                Id_Etud: etudiant.Id_Etud,
                Nom_Etud: etudiant.Nom_Etud,
                Prenom_Etud: etudiant.Prenom_Etud,
                Sexe: etudiant.Sexe,
                Classe: etudiant.Classe,
                Filiere: etudiant.Filiere
            }
        });
    });
});

// =======================
// 🔒 Route GET : Liste des étudiants (protégée)
// =======================
router.get('/', (req, res) => {
    //console.log('Accès à /etudiants par :', req.user);
    const sql = 'SELECT * FROM etudiant';
    db.query(sql, (err, results) => {
        if (err) {
          //console.error('Erreur lors de la récupération des étudiants :', err);
          return res.status(500).json({ message: 'Erreur serveur.' });
        }
        res.status(200).json(results);
    });
});

//const { verifyToken, hasAnyRole } = require('../middleware/auth');

router.get('/:id', (req, res) => {
  const etudiantId = req.params.id;

  // Sécurité : empêcher un étudiant de voir les données d’un autre
  /*if (req.user.role === 'etudiant' && req.user.Id_Etud != etudiantId) {
    return res.status(403).json({ message: 'Accès interdit à cet étudiant.' });
  }*/

  const sql = 'SELECT * FROM etudiant WHERE Id_Etud = ?';
  db.query(sql, [etudiantId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération :', err);
      return res.status(500).json({ message: 'Erreur serveur.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Étudiant non trouvé.' });
    }

    res.status(200).json(results[0]);
  });
});


module.exports = router;
