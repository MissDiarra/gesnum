const multer = require('multer');
const path = require('path');
const db = require('../db'); // connexion mysql

// 🧩 Fonction utilitaire pour mapper les lignes SQL
function mapMemoireRows(rows) {
  return rows.map(row => ({
    id: row.Id_Mem,
    titre: row.Titre,
    annee: row.Annee,
    niveau: row.Niveau,
    filiere: row.Filiere,
    documentUrl: row.DocumentUrl,
    dateAjout: row.DateA_jout,
    etudiant: {
      nom: row.etudiant_nom || '',
      prenom: row.etudiant_prenom || ''
    },
    encadreur: {
      Nom_Encad: row.encadreur_nom || '',
      Prenom_Encad: row.encadreur_prenom || ''
    }
  }));
}

// 📦 Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/memoires'),
  filename: (req, file, cb) => {
    const sanitized = file.originalname
      .replace(/\s+/g, '_') // remplace les espaces par des underscores
      .replace(/[^a-zA-Z0-9_.-]/g, ''); // supprime les caractères spéciaux
    cb(null, Date.now() + '_' + sanitized);
  } 
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // max 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Seuls les fichiers PDF sont autorisés ❌'), false);
    }
    cb(null, true);
  }
 });

// 🔄 Lister tous les mémoires
exports.listerMemoires = (req, res) => {
  db.query(`
    SELECT m.*, e.nom_etud AS etudiant_nom, e.prenom_etud AS etudiant_prenom,
           enc.nom_encad AS encadreur_nom, enc.prenom_encad AS encadreur_prenom
    FROM memoire m
    LEFT JOIN etudiant e ON m.Id_Etud = e.Id_Etud
    LEFT JOIN encadreur enc ON m.Id_Encad = enc.Id_Encad
    WHERE m.archive = 0 AND m.corbeille = 0
  `, (err, results) => {
    if (err) {
      console.error('Erreur SQL ajout mémoire :', err.sqlMessage || err.message);
      return res.status(500).json({ error: 'Erreur chargement mémoires' });
    }  
    res.json(mapMemoireRows(results));
  });
};

// ➕ Ajouter un mémoire
exports.ajouterMemoire = [
  upload.single('document'),
  (req, res) => {
    // 🔍 Ajout des logs pour débogage
    const { titre, annee, niveau, filiere, Id_Etud, Id_Encad } = req.body;
    //const anneeInt = parseInt(annee, 10);
    const filePath = req.file ? `/uploads/memoires/${req.file.filename}` : null;

    // ✅ Validation des champs
    if (!titre || !annee || !niveau || !filiere || !Id_Etud || !Id_Encad || !filePath) {
      return res.status(400).json({ error: 'Champs obligatoires ou fichier manquants.' });
    }
    //console.log('Fichier reçu :', req.file.originalname);
    // 🔍 Vérification de doublon
    /*const checkSql = `SELECT * FROM memoire WHERE Titre = ? AND Id_Etud = ? AND archive = 0`;
    db.query(checkSql, [titre, Id_Etud], (err, results) => {
      if (err) return res.status(500).json({ error: 'Erreur vérification doublon.' });
      if (results.length > 0) {
        return res.status(409).json({ error: 'Ce mémoire existe déjà pour cet étudiant.' });
      }
      // ✅ Insertion si pas de doublon
      //console.log('Insertion mémoire avec :', [titre, annee, niveau, filiere, Id_Etud, Id_Encad, filePath]);
      const insertSql = `
        INSERT INTO memoire (Titre, Annee, Niveau, Filiere, Id_Etud, Id_Encad, DocumentUrl, Date_Ajout, archive, corbeille)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 0, 0)
      `;
      //console.log('Insertion mémoire avec :', { titre, annee, niveau, filiere, Id_Etud, Id_Encad, filePath });
      db.query(insertSql, [titre, annee, niveau, filiere, Id_Etud, Id_Encad, filePath], (err) => {
        if (err) return res.status(500).json({ error: 'Erreur serveur lors de l’ajout du mémoire.' });
        res.status(201).json({ success: true, message: 'Mémoire ajouté avec succès ✅' });
      });
    });*/
    db.query(
      `SELECT * FROM memoire WHERE Titre = ? AND Id_Etud = ? AND archive = 0`,
      [titre, Id_Etud],
      (err, results) => {
        if (err) return res.status(500).json({ error: 'Erreur vérification doublon.' });
        if (results.length > 0) {
          return res.status(409).json({ error: 'Ce mémoire existe déjà pour cet étudiant.' });
        }

        db.query(
          `INSERT INTO memoire (Titre, Annee, Niveau, Filiere, Id_Etud, Id_Encad, DocumentUrl, Date_Ajout, archive, corbeille)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 0, 0)`,
          [titre, annee, niveau, filiere, Id_Etud, Id_Encad, filePath],
          (err) => {
            if (err) return res.status(500).json({ error: 'Erreur ajout mémoire.' });
            res.status(201).json({ success: true, message: 'Mémoire ajouté avec succès ✅' });
          }
        );
      }
    );
  }
];

// 🔍 Obtenir un mémoire par ID
exports.getMemoireById = (req, res) => {
  const id = req.params.id;
  db.query(`
    SELECT m.*, e.nom_etud AS etudiant_nom, e.prenom_etud AS etudiant_prenom,
           enc.nom_encad AS encadreur_nom, enc.prenom_encad AS encadreur_prenom
    FROM memoire m
    LEFT JOIN etudiant e ON m.Id_Etud = e.Id_Etud
    LEFT JOIN encadreur enc ON m.Id_Encad = enc.Id_Encad
    WHERE m.Id_Mem = ?
  `, [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erreur chargement mémoire' });
    if (results.length === 0) return res.status(404).json({ error: 'Mémoire introuvable' });
    //const row = results[0];
    res.json(mapMemoireRows(results)[0]);
    //const memoire 
    //res.json({
      /*id: row.Id_Mem,
      titre: row.Titre,
      annee: row.Annee,
      niveau: row.Niveau,
      filiere: row.Filiere,
      documentUrl: row.DocumentUrl,
      dateAjout: row.DateA_jout,
      etudiant: {
        nom: row.etudiant_nom || '',
        prenom: row.etudiant_prenom || ''
      },
      encadreur: {
        Nom_Encad: row.encadreur_nom || '',
        Prenom_Encad: row.encadreur_prenom || ''
      }*/
    //});
    //res.json(memoire);
  });
};

// 🗑️ Déplacer vers corbeille
exports.deplacerVersCorbeille = (req, res) => {
  const id = req.params.id;
  db.query(`UPDATE memoire SET corbeille = 1 WHERE Id_Mem = ?`, [id], (err) => {
    if (err) return res.status(500).json({ error: 'Erreur déplacement vers corbeille' });
    res.json({ success: true, message: 'Mémoire déplacé vers la corbeille 🗑️' });
  });
};

// 📦 Archiver un mémoire
exports.archiverMemoire = (req, res) => {
  const id = req.params.id;
  db.query(`UPDATE memoire SET archive = 1 WHERE Id_Mem = ?`, [id], (err) => {
    if (err) return res.status(500).json({ error: 'Erreur archivage mémoire' });
    res.json({ success: true, message: 'Mémoire archivé' });
  });
};

// 🔁 Restaurer un mémoire
exports.restaurerMemoire = (req, res) => {
  const id = req.params.id;
  db.query(`UPDATE memoire SET archive = 0, corbeille = 0 WHERE Id_Mem = ?`, [id], (err) => {
    if (err) return res.status(500).json({ error: 'Erreur restauration mémoire' });
    res.json({ success: true, message: 'Mémoire restauré ✅' });
  });
};

//modifier un mémoire
exports.modifierMemoire = (req, res) => {
  const id = req.params.id;
  const { titre, annee, niveau, filiere } = req.body;

  if (!titre || !annee || !niveau || !filiere) {
    return res.status(400).json({ error: 'Champs requis manquants ❌' });
  }

  /*const updateSql = `
    UPDATE memoire
    SET Titre = ?, Annee = ?, Niveau = ?, Filiere = ?
    WHERE Id_Mem = ?
  `;*/
  db.query(
    `UPDATE memoire SET Titre = ?, Annee = ?, Niveau = ?, Filiere = ? WHERE Id_Mem = ?`,
    //updateSql, 
    [titre, annee, niveau, filiere, id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Erreur modification mémoire' });
      res.json({ success: true, message: 'Mémoire modifié ✅' });
    }
  );
};

// 🔄 Lister les mémoires en corbeille
exports.listerCorbeille = (req, res) => {
  db.query(`
    SELECT m.*, e.nom_etud AS etudiant_nom, e.prenom_etud AS etudiant_prenom,
           enc.nom_encad AS encadreur_nom, enc.prenom_encad AS encadreur_prenom
    FROM memoire m
    LEFT JOIN etudiant e ON m.Id_Etud = e.Id_Etud
    LEFT JOIN encadreur enc ON m.Id_Encad = enc.Id_Encad
    WHERE m.corbeille = 1
  `, (err, results) => {
    if (err) return res.status(500).json({ error: 'Erreur chargement corbeille' });
    res.json(mapMemoireRows(results));
  });
};

// ❌ Supprimer définitivement
exports.supprimerDefinitif = (req, res) => {
  const id = req.params.id;
  db.query(`DELETE FROM memoire WHERE Id_Mem = ?`, [id], (err) => {
    if (err) return res.status(500).json({ error: 'Erreur suppression définitive' });
    res.json({ success: true, message: 'Mémoire supprimé définitivement 🗑️' });
  });
};

//liste des archives
exports.listerArchives = (req, res) => {
  db.query(`
    SELECT m.*, 
           e.nom_etud AS etudiant_nom, e.prenom_etud AS etudiant_prenom,
           enc.nom_encad AS encadreur_nom, enc.prenom_encad AS encadreur_prenom
    FROM memoire m
    LEFT JOIN etudiant e ON m.Id_Etud = e.Id_Etud
    LEFT JOIN encadreur enc ON m.Id_Encad = enc.Id_Encad
    WHERE m.archive = 1 AND m.corbeille = 0
  `, (err, results) => {
    if (err) return res.status(500).json({ error: 'Erreur chargement archives' });
    res.json(mapMemoireRows(results));
  });
};
//retourne les statistiques

exports.getStatistiques = async (req, res) => {
  console.log('getStatistiques appelé ✅');
  try {
    // 📊 Total mémoires
    const [totalRows] = await db.promise().query(`
      SELECT COUNT(*) AS total FROM memoire WHERE corbeille = 0
    `);
    const total = totalRows[0]?.total ?? 0;
    console.log('🧪 totalRows:', totalRows);

    // 📦 Archives
    const [archiveRows] = await db.promise().query(`
      SELECT COUNT(*) AS archives FROM memoire WHERE archive = 1 AND corbeille = 0
    `);
    const archives = archiveRows[0]?.archives ?? 0;
    console.log('🧪 archiveRows:', archiveRows);
    
    // 📅 Mémoires par année
    const [anneeRows] = await db.promise().query(`
      SELECT Annee, COUNT(*) AS count
      FROM memoire
      WHERE corbeille = 0 AND Annee IS NOT NULL AND Annee != ''
      GROUP BY Annee
      ORDER BY Annee DESC
    `);
    //const anneeRows = Array.isArray(anneeResult) ? anneeResult : [];
    console.log('📊 Années récupérées :', anneeRows.map(a => a.Annee));

    // 🎓 Répartition par filière
    const [filiereRows] = await db.promise().query(`
      SELECT Filiere, COUNT(*) AS count
      FROM memoire
      WHERE corbeille = 0 AND Filiere IS NOT NULL AND Filiere != ''
      GROUP BY Filiere
    `);
    //const filiereRows = Array.isArray(filiereResult) ? filiereResult : [];

    // 🧑‍🏫 Répartition par encadrant
    const [encadrantRows] = await db.promise().query(`
      SELECT enc.nom_encad AS nom, enc.prenom_encad AS prenom, COUNT(*) AS count
      FROM memoire m
      JOIN encadreur enc ON m.Id_Encad = enc.Id_Encad
      WHERE m.corbeille = 0
      GROUP BY enc.nom_encad, enc.prenom_encad
    `);
    //const encadrantRows = Array.isArray(encadrantResult) ? encadrantResult : [];

    // 🏆 Encadrant le plus actif
    const [topEncadrantRows] = await db.promise().query(`
      SELECT enc.nom_encad AS nom, enc.prenom_encad AS prenom, COUNT(*) AS count
      FROM memoire m
      JOIN encadreur enc ON m.Id_Encad = enc.Id_Encad
      WHERE m.corbeille = 0
      GROUP BY enc.nom_encad, enc.prenom_encad
      ORDER BY count DESC
      LIMIT 1
    `);
    const encadrantPlusActif = topEncadrantRows?.[0]
      ? `${topEncadrantRows[0].nom} ${topEncadrantRows[0].prenom}`
      : 'Aucun';

    // 🎓 Filière dominante
    const [topFiliereRows] = await db.promise().query(`
      SELECT Filiere, COUNT(*) AS count
      FROM memoire
      WHERE corbeille = 0 AND Filiere IS NOT NULL AND Filiere != ''
      GROUP BY Filiere
      ORDER BY count DESC
      LIMIT 1
    `);
    const filiereDominante = topFiliereRows?.[0]?.Filiere ?? 'Inconnue';

    // 📅 Année la plus représentée
    const [topAnneeRows] = await db.promise().query(`
      SELECT Annee, COUNT(*) AS count
      FROM memoire
      WHERE corbeille = 0 AND Annee IS NOT NULL AND Annee != ''
      GROUP BY Annee
      ORDER BY count DESC
      LIMIT 1
    `);
    const anneeMajoritaire = topAnneeRows?.[0]?.Annee ?? 'Non définie';

    // ✅ Vérification si la base est vide
    /*if (!totalRows.length || !anneeRows.length) {
      return res.status(200).json({
        global: { total: 0, archives: 0 },
        parAnnee: [],
        parFiliere: [],
        parEncadrant: []
      });
    }*/

    // ✅ Extraction des valeurs
    
    
    /*const topEncadrant = topEncadrantRows[0]
      ? `${topEncadrantRows[0].nom} ${topEncadrantRows[0].prenom}`
      : 'Aucun';

    const topFiliere = topFiliereRows[0]?.Filiere || 'Inconnue';
    const topAnnee = topAnneeRows[0]?.Annee || 'Non définie';*/


    // ✅ Log pour vérification
    /*console.log('📤 Statistiques envoyées :', {
      global: { total, archives },
      parAnnee: anneeRows,
      parFiliere: filiereRows,
      parEncadrant: encadrantRows,
      resume: {
        encadrantPlusActif,
        filiereDominante,
        anneeMajoritaire
      }
    });*/

    // ✅ Réponse JSON
    res.json({
      global: { total, archives },
      parAnnee: anneeRows,
      parFiliere: filiereRows,
      parEncadrant: encadrantRows,
      resume: {
        encadrantPlusActif,
        filiereDominante,
        anneeMajoritaire
      }
    });
  } catch (error) {
    console.error('Erreur chargement statistiques ❌', error.message);
    res.status(500).json({ error: 'Erreur chargement statistiques' });
  }
};
