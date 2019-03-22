'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const manualStepSchema = require('./manual-step');
const timerStepSchema = require('./timer-step');
const calendarStepSchema = require('./calendar-step');

const processSchema = new Schema({
  manualSteps: [manualStepSchema],
  timerSteps: [timerStepSchema],
  calendarSteps: [calendarStepSchema]
});

module.exports = processSchema;
