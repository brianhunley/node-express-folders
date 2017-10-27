var express = require('express');
var router = express.Router();

/* GET apis listing. */
router.get('/', function(req, res, next) {
  res.send('responding with an apis routing...');
});

module.exports = router;
