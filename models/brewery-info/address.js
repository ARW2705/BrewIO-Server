'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new Schema({
  street: {
    type: String,
    lowercase: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  region: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  postalCode: {
    type: Number
  }
}, {
  timestamps: true
});

module.exports = addressSchema;
