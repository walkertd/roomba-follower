'use strict';

const chalk = require('chalk');
const debug = require('debug')('roombafollower');

var express = require('express');


var app = express();

app.use(express.static('./public'));
// TODO - make some public pages

// TODO - wtf are views?

// TODO - auth middleware

// TODO - ssl support

// TODO - error handling middleware

// TODO - routing
// TODO - make hello world route
// TODO - make route for showing all recordings in table

// TODO - move index.js to bin/recording.js
// TODO - make recording entry in packages.json (node.js./bin/recording.js)
// TODO - make start script for recording



module.exports = app;