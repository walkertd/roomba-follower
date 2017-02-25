'use strict';
var express = require('express');
var router = express.Router();

var mapConfig = require('../config/map.json');

router.get('/', function (req, res) {
  res.render('map.html', {title: 'Path Map', mapvalues: mapConfig});
});


module.exports = router;
