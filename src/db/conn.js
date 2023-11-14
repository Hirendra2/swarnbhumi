const mongoose = require('mongoose');

const url = 'mongodb+srv://doadmin:86405bxhS1ksR7Z3@db-mongodb-blr1-12224-c870d415.mongo.ondigitalocean.com/Bhumi?tls=true&authSource=admin&replicaSet=db-mongodb-blr1-12224';

const connectWithRetry = () => {
  mongoose
    .connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true,
    })
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((error) => {
      console.error('Error connecting to MongoDB:', error);
      console.log('Retrying connection in 5 seconds...');
      setTimeout(connectWithRetry, 5000); // Retry after 5 seconds
    });
};

connectWithRetry();

const db = mongoose.connection;

db.on('error', (error) => {
  console.error('Error with MongoDB connection:', error);
});

module.exports = db;    // db.on('error', (error) => {
    //   console.error('MongoDB connection error:', error);
    //   setTimeout(handleDisconnect, 1000);
    // });

    // db.once('open', () => {
    //   console.log('MongoDB connection successful');
    // });

    // function handleDisconnect() {
    //   mongoose.connect(url, {
    //     useNewUrlParser: true,
    //     useUnifiedTopology: true,
    //     connectTimeoutMS: 90000,
    //   })
    //     .then(() => {
    //       console.log('Reconnected to MongoDB');
    //     })
    //     .catch((error) => {
    //       console.error('Error reconnecting to MongoDB:', error);
    //       setTimeout(handleDisconnect, 1000);
    //     });

    //   db = mongoose.connection;

    //   db.on('error', (error) => {
    //     console.error('MongoDB reconnection error:', error);
    //     setTimeout(handleDisconnect, 1000);
    //   });

    //   db.once('open', () => {
    //     console.log('MongoDB reconnection successful');
    //   });
    // }

   // module.exports = db;