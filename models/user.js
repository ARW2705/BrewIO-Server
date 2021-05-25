'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const imageSchema = require('./image');
const selectedUnitsSchema = require('./units');

const userSchema = new Schema({
  cid: {
    type: String,
    default: ''
  },
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
  preferredUnitSystem: {
    type: String,
    default: 'english standard'
  },
  units: {
    type: selectedUnitsSchema,
    required: true
  },
  userImage: imageSchema,
  breweryLabelImage: imageSchema,
  batchList: [
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
