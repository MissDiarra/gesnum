const mongoose = require('mongoose');

const utilisateurSchema = new mongoose.Schema({
  Email_Util: { type: String, required: true, unique: true },
  Mot_passe_Util: { type: String, required: true },
  Nom_Util: { type: String }
});

module.exports = mongoose.model('Utilisateur', utilisateurSchema);
