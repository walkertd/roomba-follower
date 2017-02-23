'use strict';
var express = require('express');
var router = express.Router();

var response = {
    documentation: 'https://github.com/walkertd/roomba-follower'
};

router.get('/', function(req, res) {
    res.send(response);
});

router.get('/help', function(req, res) {
    response.confused = "I don't really know what I'm doing.  This is a learning experience.";
    res.send(response);
});

module.exports = router;
