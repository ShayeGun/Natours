const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE_LOCAL;

mongoose.connect(DB).then((conn) => {
  // console.log(conn.connections);
  console.log('DB connected😁');
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);

  server.close(() => {
    console.log('App in shutting down ❌');

    process.exit(1);
  });
});
