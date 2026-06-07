// mongo-init/01_create_user.js
// Runs automatically when the mongo container is first created.
// Creates a dedicated "linksports" database user.

db = db.getSiblingDB('linksports');

db.createUser({
  user: 'linksports',
  pwd: 'linksports123',
  roles: [{ role: 'readWrite', db: 'linksports' }]
});

// Create initial collections (optional – Mongoose will do this too)
db.createCollection('players');
db.createCollection('coaches');
db.createCollection('organizations');
db.createCollection('followers');
db.createCollection('profilelikes');
db.createCollection('profileviewslogs');
db.createCollection('promocodes');

print('✅ linksports DB and user created');
