'use strict';
const chalk = require('chalk');
const debug = require('debug')('roombafollower');
var util = require('util');
var path = require('path');

var express = require('express');
var router = express.Router();

var database = require('../lib/database');

router.get('/records/mission/:mission', function (req, res) {
    database.db.any('select * from recordings where mission_number=$1', req.params.mission)
        .then(function (data) { res.json(data); })
        .catch(function (error) { res.send(error); });
});
router.get('/records/mission/:mission/cycle/:cycle', function (req, res) {
    database.db.any('select * from recordings where mission_number=$1 and cycle=$2', [req.params.mission, req.params.cycle])
        .then(function (data) { res.json(data); })
        .catch(function (error) { res.send(error); });
});
router.get('/records/mission/:mission/phase/:phase', function (req, res) {
    database.db.any('select * from recordings where mission_number=$1 and phase=$2', [req.params.mission, req.params.phase])
        .then(function (data) { res.json(data); })
        .catch(function (error) { res.send(error); });
});
router.get('/records/mission/:mission/cycle/:cycle/phase/:phase', function (req, res) {
    database.db.any('select * from recordings where mission_number=$1 and cycle=$2 and phase=$3', [req.params.mission, req.params.cycle, req.params.phase])
        .then(function (data) { res.json(data); })
        .catch(function (error) { res.send(error); });
});
router.get('/records/id/:id', function (req, res) {
    database.db.any('select * from recordings where id=$1', req.params.id)
        .then(function (data) { res.json(data); })
        .catch(function (error) { res.send(error); });
});
router.get('/records/latest', function (req, res) {
    database.db.any('select * from recordings where id=(select max(id) from recordings)', req.params.mission)
        .then(function (data) { res.json(data); })
        .catch(function (error) { res.send(error); });
});
router.get('/records/all', getAllRecordings);
router.get('/records', getAllRecordings);
// TODO - /records/after/:after and /records/before/:before

router.get('/scale/mission/:mission', function (req, res) {
    database.db.one('select max(pose_x) as max_pose_x, min(pose_x) as min_pose_x, max(pose_y) as max_pose_y, min(pose_y) as min_pose_y from recordings where mission_number=$1', req.params.mission)
        .then(function (data) { res.json(data); })
        .catch(function (error) { res.send(error);});
});

router.get('/list/missions', function (req, res) {
    database.db.any('select mission_number from recordings group by mission_number order by mission_number asc')
        .then(function (data) {
            res.json(data.map(function (row) {
                return row.mission_number;
            }));
        })
        .catch(function (error) { res.send(error); });
});

function getAllRecordings(req, res) {
    database.db.any('select * from recordings')
        .then(function (data) { res.json(data); })
        .catch(function (error) { res.send(error); });
};

var toType = function (obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

module.exports = router;
