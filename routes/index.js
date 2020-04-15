const express = require('express');
const authenticate = require('../authenticate');

const router = express.Router();

router.get('/', (req, res, next) => {
  res.sendStatus(400);
});

module.exports = router;
