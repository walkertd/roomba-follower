'use strict';
const chalk = require('chalk');
const debug = require('debug')('roombafollower');
var util = require('util');
var path = require('path');

var express = require('express');
var router = express.Router();

var pgp = require('pg-promise')();
var dbConfig = require('../config/db.json');

if (!dbConfig.password || !dbConfig.username || !dbConfig.host || !dbConfig.database) {
	debug('Missing element of db connection string.');
	throw new Error('Database config not found. Please edit config/db.json file with your robot credentials.');
}

var connectionString = `postgres://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
var db = pgp(connectionString);

router.get('/data')

var response = {
    documentation: 'https://github.com/walkertd/roomba-follower'
};

router.get('/', function(req, res) {
    db.any("SELECT * FROM recordings")
        .then(function (data) {
            var records = [];
            data.forEach(function(element, index, array) {
                var row = [ element.time_stamp,
                            element.id,
                            element.cycle,
                            element.phase,
                            element.expirem,
                            element.rechrgm,
                            element.error,
                            element.notready,
                            element.elapsed_time,
                            element.area_cleaned,
                            element.initiator,
                            element.mission_number,
                            element.pose_theta,
                            element.pose_x,
                            element.pose_y,
                            element.bin_present,
                            element.bin_full
                            ];
                records.push(row);
            });
            res.render(path.join('data','all.html'), { title: 'All data', tabledata: JSON.stringify(records)});
        })
        .catch(function(error) {
            res.send(error);
        });
});

var toType = function(obj) {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

module.exports = router;
