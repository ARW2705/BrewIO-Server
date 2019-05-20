'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const recipeMasterSchema = require('../models/recipe-master');
const inProgressSchema = require('../models/in-progress');

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
    required: true
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
  ],
  inProgressList: [inProgressSchema],
  friendList: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
}, {
  timestamps: true
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
