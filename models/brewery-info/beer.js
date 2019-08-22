'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const brewery = require('../brewery-info/brewery');

const beerSchema = new Schema({
  name: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  brewery: {
    type: Schema.Types.ObjectId,
    ref: 'Brewery',
    required: true
  },
  description: {
    type: String
  },
  ABV: {
    type: Number
  },
  IBU: {
    type: Number
  },
  SRM: {
    type: Number
  },
  labelImageUrl: {
    type: String
  },
  collaborations: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Brewery'
    }
  ]
}, {
  timestamps: true
});

beerSchema.index({'beerName': 1, 'brewery': 1}, {unique: true});

module.exports = mongoose.model('BeerData', beerSchema);
