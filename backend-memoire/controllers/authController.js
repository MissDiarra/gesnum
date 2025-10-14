const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const UtilisateurModel = require('../models/Utilisateur');
const AdminModel = require('../models/Admin');
const sendEmail = require('../utils/sendEmail');

const SECRET_KEY = process.env.SECRET_KEY;
const RESET_SECRET = process.env.RESET_SECRET;

// 🔐 Connexion
exports.login = async (req, res) => {
  const { identifiant, motdepasse } = req.body;

  try {
    let user = null;
    let role = null;

    // Vérifie si c’est un admin 
    user = await AdminModel.findOne({ Email_Admin: identifiant });
    if (user && user.Mot_passe_Admin === motdepasse) {
      role = 'admin';
    }
    
    // Sinon, vérifie si c’est un utilisateur
    if (!user) {
      user = await UtilisateurModel.findOne({ Email_Util: identifiant });
      if (user && user.Mot_passe_Etud === motdepasse) {
        role = 'utilisateur';
      } 
    }

    if (!user || !role) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    const token = jwt.sign({ id: user._id, role }, SECRET_KEY, { expiresIn: '1h' });

    return res.json({ token, role, user });

  } catch (error) {
    console.error('Erreur de connexion :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// 📩 Demande de réinitialisation
exports.requestResetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user =
      await AdminModel.findOne({ Email_Admin: email }) ||
      await UtilisateurModel.findOne({ Email_Util: email });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const token = jwt.sign({ id: user._id }, RESET_SECRET, { expiresIn: '15m' });
    const resetLink = `http://localhost:4200/reset-password-confirm?token=${token}`;

    await sendEmail(email, `Cliquez ici pour réinitialiser votre mot de passe : ${resetLink}`);
    res.json({ message: 'Email envoyé ✅' });

  } catch (error) {
    console.error('Erreur lors de la demande de reset :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};  

// 🔄 Confirmation du nouveau mot de passe
exports.confirmResetPassword = async (req, res) => {
  const { token, nouveauMotDePasse } = req.body;

  try {
    const decoded = jwt.verify(token, RESET_SECRET);
    const userId = decoded.id;

    await AdminModel.updateOne({ _id: userId }, { Mot_passe_Admin: nouveauMotDePasse });
    await UtilisateurModel.updateOne({ _id: userId }, { Mot_passe_Util: nouveauMotDePasse });

    res.json({ message: 'Mot de passe mis à jour ✅' });

  } catch (error) {
    console.error('Erreur de confirmation :', error);
    res.status(400).json({ message: 'Lien invalide ou expiré ❌' });
  }
};
