// hash.js
const bcrypt = require('bcryptjs');

const motDePasse = 'kadi_dia'; // 🔐 Ton mot de passe en clair

bcrypt.hash(motDePasse, 10).then(hash => {
  console.log('Mot de passe haché :', hash);
});
