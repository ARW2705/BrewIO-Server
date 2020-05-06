'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

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
  activeBatchList: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Batch'
    }
  ],
  masterList: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Recipe'
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
