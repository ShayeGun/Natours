const fs = require('node:fs');
const mongoose = require('mongoose');
const User = require('./../../models/userModel');

const DB = 'mongodb://localhost:27017/natours';

mongoose.connect(DB).then((conn) => {
  console.log('DB connected😁');
});

const file = fs.readFileSync('./dev-data/data/users.json', {
  encoding: 'utf-8',
});

fileObj = JSON.parse(file);

async function insert(Obj) {
  try {
    for (let i = 0; i < Obj.length; i++) {
      await User.create(Obj[i]);
    }
    console.log('Complete 💯');
    process.exit(0);
  } catch (err) {
    console.log('ERROR 😡', err.message);
    process.exit(1);
  }
}

insert(fileObj);
