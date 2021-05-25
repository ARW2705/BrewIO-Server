'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const archiveSchema = new Schema({
  batchList: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Batch'
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

module.exports = mongoose.model('Archive', archiveSchema)
