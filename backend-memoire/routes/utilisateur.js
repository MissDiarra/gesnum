const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/inscription', async (req, res) => {
  const { Nom_Util, Email_Util, Mot_Passe_Util, Role, Tel_Util } = req.body;

  if (!Nom_Util || !Email_Util || !Mot_Passe_Util || !Role || !Tel_Util) {
    return res.status(400).json({ message: 'Champs requis manquants.' });
  }
  // ✅ Vérification du rôle ici
  const rolesAutorises = ['Admin', 'Utilisateur'];
  if (!rolesAutorises.includes(Role)) {
    return res.status(400).json({ message: 'Rôle invalide.' });
  }
  console.log(`Inscription avec rôle accepté : ${Role}`);

  try {
    const hash = await bcrypt.hash(Mot_Passe_Util, 10);

    db.query(
      'INSERT INTO utilisateur (Nom_Util, Email_Util, Mot_Passe_Util, Role, Tel_Util) VALUES (?, ?, ?, ?, ?)',
      [Nom_Util, Email_Util, hash, Role, Tel_Util],
      (err) => {
        if (err) return res.status(500).json({ message: 'Erreur DB' });
        res.json({ message: 'Utilisateur inscrit ✅' });
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.put('/reset-password', async (req, res) => {
  const { Email_Util, ancienMotDePasse, nouveauMotDePasse } = req.body;

  db.query('SELECT * FROM utilisateur WHERE Email_Util = ?', [Email_Util], async (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    const utilisateur = results[0];
    const match = await bcrypt.compare(ancienMotDePasse, utilisateur.Mot_Passe_Util);
    if (!match) return res.status(401).json({ message: 'Ancien mot de passe incorrect.' });

    const nouveauHash = await bcrypt.hash(nouveauMotDePasse, 10);
    db.query('UPDATE utilisateur SET Mot_Passe_Util = ? WHERE Email_Util = ?', [nouveauHash, Email_Util], (err) => {
      if (err) return res.status(500).json({ message: 'Erreur lors de la mise à jour.' });
      res.json({ message: 'Mot de passe mis à jour ✅' });
    });
  });
});

router.post('/reset-password/request', async (req, res) => {
  console.log('Requête reçue côté backend :', req.body);
  const { email } = req.body;

  db.query('SELECT * FROM utilisateur WHERE Email_Util = ?', [email], (err, results) => {
    if (err) {
      console.error('Erreur DB :', err);
       return res.status(500).json({ message: 'Erreur DB ❌' });
    }  

    if (results.length === 0) {
      console.log('Email non trouvé dans la base :', email);
      return res.status(404).json({ message: 'Email introuvable ❌' });
    }

    // Générer un token, envoyer l'email, etc.
    console.log('Email trouvé :', results[0]);
    return res.status(200).json({ message: 'Email envoyé ✅' });
  });  
});


router.get('/', (req, res) => {
  db.query('SELECT * FROM utilisateur WHERE Corbeille = 0', (err, results) => {
    if (err) return res.status(500).json({ message: 'Erreur DB' });
    res.json(results);
  });
});

router.get('/corbeille', (req, res) => {
  db.query('SELECT * FROM utilisateur WHERE Corbeille = 1', (err, results) => {
    if (err) return res.status(500).json({ message: 'Erreur DB' });
    res.json(results);
  });
});

router.delete('/:id', (req, res) => {
  const id = req.params.id;

  db.query('UPDATE utilisateur SET Corbeille = 1 WHERE Id_Util = ?', [id], (err) => {
    if (err) return res.status(500).json({ message: 'Erreur DB' });
    res.json({ message: 'Utilisateur déplacé dans la corbeille ✅' });
  });
});

router.put('/restaurer/:id', (req, res) => {
  const id = req.params.id;
  db.query('UPDATE utilisateur SET Corbeille = 0 WHERE Id_Util = ?', [id], (err) => {
    if (err) return res.status(500).json({ message: 'Erreur DB' });
    res.json({ message: 'Utilisateur restauré ✅' });
  });
});

router.delete('/supprimer-definitif/:id', (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM utilisateur WHERE Id_Util = ?', [id], (err) => {
    if (err) return res.status(500).json({ message: 'Erreur DB' });
    res.json({ message: 'Utilisateur supprimé définitivement 🗑️' });
  });
});

router.get('/email/:email', (req, res) => {
  const email = decodeURIComponent(req.params.email);
  db.query('SELECT * FROM utilisateur WHERE Email_Util = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Erreur DB' });
    if (results.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    res.json(results[0]);
  });
});

router.put('/:id', (req, res) => {
  const id = req.params.id;
  const { Nom_Util, Email_Util, Tel_Util } = req.body;
  /*if (!Nom_Util || !Email_Util || !Tel_Util) {
    return res.status(400).json({ message: 'Champs requis manquants.' });
  }*/

  db.query(
    'UPDATE utilisateur SET Nom_Util = ?, Email_Util = ?, Tel_Util = ? WHERE Id_Util = ?',
    [Nom_Util, Email_Util, Tel_Util, id],
    (err) => {
      if (err) return res.status(500).json({ message: 'Erreur DB' });
      res.json({ message: 'Informations mises à jour ✅' });
    }
  );
});

router.put('/desactiver/:id', (req, res) => {
  const id = req.params.id;
  db.query('UPDATE utilisateur SET Actif = 0 WHERE Id_Util = ?', [id], (err) => {
    if (err) return res.status(500).json({ message: 'Erreur DB' });
    res.json({ message: 'Compte désactivé ✅' });
  });
});

router.post('/login', (req, res) => {
  console.log('Requête reçue :', req.body);
  const { email, motDePasse } = req.body;
  const sql = 'SELECT * FROM utilisateur WHERE Email_Util = ?';
  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Erreur DB' });

    //si user existe verification classique
    if (results.length > 0) {
      const utilisateur = results[0];
      console.log('Utilisateur trouvé :', utilisateur);
      bcrypt.compare(motDePasse, utilisateur.Mot_Passe_Util, (err, match) => {
        console.log('Résultat comparaison :', match);
        if (err || !match) return res.status(401).json({ message: 'Mot de passe incorrect' });

       // ✅ Creation du token
        const token = jwt.sign(
          { id: utilisateur.Id_Util, role: utilisateur.Role }, // ✅ rôle inclus
          process.env.SECRET_KEY,
          { expiresIn: '1h' }
        );

        return res.json({
          message: 'Connexion réussie ✅',
          token,
          role: utilisateur.Role,
          user: utilisateur
        });
        /*const match = await bcrypt.compare(motdepasse, utilisateur.Mot_Passe_Util);
        if (!match) return res.status(401).json({ message: 'Mot de passe incorrect.' });*/
     });
    } else {
      //si user n'existe pas autoriser si ce n'est pas un admin
      if (email.toLowerCase().includes('admin')) {
        return res.status(401).json({ message: 'Admin non reconnu ❌' });
      }
      //générer un token temporaire pour l'utilisateur non enregistré 
      console.log(`Connexion libre autorisée pour : ${email}`);
      const token = jwt.sign(
        { email, role: 'Utilisateur' },
        process.env.SECRET_KEY,
        { expiresIn: '1h' }
      );

      return res.json({
        message: 'Connexion sans enregistrement ✅',
        token,
        role: 'Utilisateur',
        user: { Email_Util: email, Role: 'Utilisateur' }
      });
    }
  });
});  
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Token manquant.' });

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Token invalide.' });

    // Bloquer les utilisateurs non enregistrés sur certaines routes
   /* if (!decoded.id && req.path !== '/login') {
      return res.status(403).json({ message: 'Accès réservé aux utilisateurs enregistrés.' });
    }*/

    req.user = decoded;
    next();
  });
}

module.exports = router;