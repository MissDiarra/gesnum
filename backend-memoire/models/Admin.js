const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    Email_Admin: { type: String, required: true, unique: true },
    Mot_passe_Admin: { type: String, required: true },
    Nom_Admin: { type: String }
});

module.exports = mongoose.model('Admin', adminSchema);