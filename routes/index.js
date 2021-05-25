const express = require('express');
const authenticate = require('../authenticate');

const router = express.Router();

router.get('/', (req, res, next) => {
  res.statusCode = 400;
  res.setHeader('content-type', 'application/json');
  res.json({ error: 'Invalid route' });
});

module.exports = router;
