'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const recipeMasterSchema = require('../models/recipe-master');
const inProgressSchema = require('../models/in-progress');
const inventorySchema = require('../models/inventory');

const userSchema = new Schema({
  firstname: {
    type: String
  },
  lastname: {
    type: String
  },
  email: {
    type: String,
    required: true
  },
  admin: {
    type: Boolean,
    default: false
  },
  editor: {
    type: Boolean,
    default: false
  },
  preferredUnits: {
    type: String,
    default: 'e'
  },
  inProgressList: [
    {
      type: Schema.Types.ObjectId,
      ref: 'InProgress'
    }
  ],
  masterList: [
    {
      type: Schema.Types.ObjectId,
      ref: 'RecipeMaster'
    }
  ],
  friendList: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  inventoryList: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Inventory'
    }
  ]
}, {
  timestamps: true
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
