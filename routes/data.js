'use strict';
const chalk = require('chalk');
const debug = require('debug')('roombafollower');
var util = require('util');
var path = require('path');

var express = require('express');
var router = express.Router();

var database = require('../lib/database');

router.get('/', function(req, res) {
    database.db.any({text: 'select * from recordings', rowMode: 'array'})
        .then(function (data) {
            res.render('data.html', { title: 'All data', tabledata: JSON.stringify(data)});
        })
        .catch(function(error) {
            res.send(error);
        });
});

var toType = function(obj) {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

module.exports = router;
