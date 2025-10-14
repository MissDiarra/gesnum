const bcrypt = require('bcryptjs');

const motDePasse = 'test123';

bcrypt.hash(motDePasse, 10).then(hash => {
  console.log('Mot de passe haché :', hash);
});
