'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const optionalItemDataSchema = new Schema({
  batchId: {
    type: String
  },
  supplierURL: {
    type: String
  },
  supplierLabelImageURL: {
    type: String
  },
  itemIBU: {
    type: String
  },
  itemSRM: {
    type: String
  },
  itemLabelImageURL: {
    type: String
  },
  itemSubname: {
    type: String
  },
  packagingDate: {
    type: String
  }
});

module.exports = optionalItemDataSchema;
