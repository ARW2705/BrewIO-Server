'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const inventorySchema = new Schema({
  cid: {
    type: String,
    default: ''
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stockCount: {
    type: Number,
    default: 0
  },
  stockQuantity: {
    type: Number,
    default: 0
  },
  stockType: {
    type: String,
    required: true
  },
  labelImageUrl: {
    type: String
  },
  packageDate: {
    type: Date,
    required: true
  },
  itemDetails: {
    master: {
      type: Schema.Types.ObjectId,
      ref: 'RecipeMaster'
    },
    recipe: {
      type: Schema.Types.ObjectId,
      ref: 'Recipe'
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Inventory', inventorySchema);
