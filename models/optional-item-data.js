'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const imageSchema = require('./image');

const optionalItemDataSchema = new Schema({
  batchId: {
    type: String
  },
  supplierURL: {
    type: String
  },
  supplierLabelImage: imageSchema,
  itemIBU: {
    type: String
  },
  itemSRM: {
    type: String
  },
  itemLabelImage: imageSchema,
  itemSubname: {
    type: String
  },
  packagingDate: {
    type: String
  }
}, {
  _id: false
});

module.exports = optionalItemDataSchema;
