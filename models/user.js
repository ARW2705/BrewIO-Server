'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const recipeMasterSchema = require('../models/recipe-master');

const userSchema = new Schema({
  firstname: {
    type: String,
    default: ''
  },
  lastname: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  admin: {
    type: Boolean,
    default: false
  },
  masterList: [
    {
      type: Schema.Types.ObjectId,
      ref: 'RecipeMaster'
    }
  ]
}, {
  timestamps: true
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
