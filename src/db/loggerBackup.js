const backup = require('mongodb-backup');
const logger = require('./logger');

const backupPath = './backup'; // Specify your backup directory here

function createMongoDBBackup() {
  const backupOptions = {
    uri: 'mongodb+srv://doadmin:86405bxhS1ksR7Z3@db-mongodb-blr1-12224-c870d415.mongo.ondigitalocean.com/Bhumi?tls=true&authSource=admin&replicaSet=db-mongodb-blr1-12224',
    root: backupPath,
  };

  backup(backupOptions)
    .then(() => {
      logger.info('MongoDB backup completed');
    })
    .catch((err) => {
      logger.error(`MongoDB backup failed: ${err}`);
    });
}

module.exports = createMongoDBBackup;
