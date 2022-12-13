const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, ' please insert your name!'] },
  email: {
    type: String,
    required: [true, ' please insert your email!'],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, ' please insert your password!'],
    minlength: 8,
    select: false,
  },
  passwordConfig: {
    type: String,
    required: [true, ' please confirm your password!'],
    validate: {
      validator: function(val) {
        return val === this.password;
      },
      message: 'Passwords must be identical😒',
    },
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead_guide', 'admin'],
    default: 'user',
  },
  photo: {
    type: String,
    default: 'default.jpeg',
  },
  changedPasswordAt: {
    type: Date,
    default: Date.now,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordConfig = undefined;

  next();
});

userSchema.pre('save', function(next) {
  // isNew --> new user is created
  if (!this.isModified('password') || this.isNew) next();
  // subtracting 5s --> because in some cases creating JWT might come faster than query DB so it insures JWT always happens after change in DB
  this.changedPasswordAt = Date.now() - 5000;
  next();
});

userSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async (userPass, bcryptPass) => {
  return await bcrypt.compare(userPass, bcryptPass);
};

userSchema.methods.changedPasswordAfter = function(JWTTimeStamp) {
  if (this.changedPasswordAt) {
    const time = parseInt(this.changedPasswordAt.getTime() / 1000, 10);
    // if password was changed after token was rendered --> true
    return time > JWTTimeStamp;
  }
  // false means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  // create a random string
  const resetToken = crypto.randomBytes(32).toString('hex');
  // encrypt reset token and store it in DB
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // give reset token 10 min life time
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // return the original(not encrypted) reset token to user
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
