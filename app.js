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
var apiRoute = require('./routes/api');
var mapRoute = require('./routes/map');
var helpRoute = require('./routes/help');

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
app.use('/api', apiRoute);
app.use('/map', mapRoute);
app.use('/help', helpRoute);


// TODO - Explore suitable javascript canvas library
//           eg. jCanvas
//               Paper.js
//               Fabric.js


// TODO - process data so it's easier for the system to deal with?
// TODO - add time slider
// TODO - add show reverse path check box - draw reverse path and erase reverse path in forward
// TODO - add show forward path check box - draw forward path and erase forward path in reverse
// TODO - fix map so it scales to max/min coordinates
// TODO - add rotation

// TODO - better detection of 'teleportation'
// TODO - vector graphics instead of bitmap?


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