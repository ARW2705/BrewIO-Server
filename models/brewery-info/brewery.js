'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = require('./address');

const brewerySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  locations: [
    {
      address: addressSchema
    }
  ],
  brandImageUrl: {
    type: String
  },
  website: {
    type: String
  },
  beerList: [
    {
      type: Schema.Types.ObjectId,
      ref: 'BeerData'
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model('Brewery', brewerySchema);
