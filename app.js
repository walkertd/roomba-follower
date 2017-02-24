'use strict';

const chalk = require('chalk');
const debug = require('debug')('roombafollower');

var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
//var cookieParser = require('cookie-parser');
var nunjucks = require('nunjucks');

// Routes
var indexRoute = require('./routes/index');
var dataRoute = require('./routes/data');


// Configure Express with Nunjucks
var app = express();

nunjucks.configure('views', {
	autoescape: false,
	express: app,
	watch: true
})
app.use(bodyParser.json());

// TODO - add middleware for cookies? (cookieParser)
// TODO - add authentication middleware? (passport)

app.use(express.static(path.join(__dirname, '/public')));

app.use('/', indexRoute);
app.use('/data', dataRoute);

// TODO - implement rest API for querying the database


// TODO - move index.js to bin/recording.js
// TODO - make recording entry in packages.json (node.js./bin/recording.js)
// TODO - make start script for recording


// Error handling middleware

// All other routes handled by this point - throw a 404.

app.use(function(req, res, next) {
	res.status(404);
	res.format({
		html: function() {
			res.render(path.join('error','404.html'), { url: req.url});
		},
		json: function() {
			res.json({error: 'Not found'});
		},
		default: function() {
			res.type('txt').send('Not found.');
		}
	});
});

module.exports = app;