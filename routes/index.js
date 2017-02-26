'use strict';
var express = require('express');
var router = express.Router();

var response = {
    documentation: 'https://github.com/walkertd/roomba-follower'
};

router.get('/', function(req, res) {
    res.send(response);
});

module.exports = router;
