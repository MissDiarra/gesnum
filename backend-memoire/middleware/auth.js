// middleware/auth.js
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;// à mettre dans .env plus tard

// 🔐 Middleware principal : vérifie le token JWT
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  //console.log('Utilisateur connecté :', req.user);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Accès refusé. Format du token invalide.' });
  }

  const token = authHeader.split(' ')[1]; // format: Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // on ajoute les infos du token à la requête
    console.log('Token reçu :', token);
    console.log('Utilisateur connecté :', decoded);
    console.log('Rôle utilisateur :', decoded.role);
    next(); // on continue vers la route protégée  
  } catch (err) {
    console.error('Erreur JWT :', err.message);
    return res.status(403).json({ message: 'Token invalide ou expiré.' });
  }
}

// 🛡️ Middleware optionnel : vérifie le rôle
function hasRole(role) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Rôle utilisateur non défini.' });
    }

    if (req.user.role.toLowerCase() !== role.toLowerCase()) {
      return res.status(403).json({ message: `Accès interdit. Rôle requis : ${role}` });
    }

    next();
  };
}

// 🛡️ Vérifie plusieurs rôles autorisés
function hasAnyRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Rôle utilisateur non défini.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Accès interdit. Rôles requis : ${roles.join(', ')}` });
    }

    next();
  };
}

module.exports = {
  verifyToken,
  hasRole,
  hasAnyRole
};
