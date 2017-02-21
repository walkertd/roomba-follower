'use strict';

const chalk = require('chalk');
var dorita980 = require('dorita980');
var util = require('util');
var pg = require('pg-promise');

var robotConfig = require('./config/roomba.json');
var dbConfig = require('./config/db.json');

var blid = robotConfig.blid;
var password = robotConfig.password;
var robotIP = robotConfig.robotIP;
var pollInterval = robotConfig.pollInterval;
var pollTimeout = robotConfig.pollTimeout;

if (!blid || !password) {
  throw new Error('Robot config not found. Please edit config/roomba.json file with your robot credentials.');
}

if (!dbConfig.password || !dbConfig.username || !dbConfig.host || !dbConfig.database) {
  throw new Error('Database config not found. Please edit config/db.json file with your robot credentials.');
}

var connectionString = `postgres://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

console.log("Connecting to postgresql database using connection string " + connectionString);
console.log();

pg.connect(connectionString, function(err, client, done) {
	if (err) {
		return console.error('Error fetching client from pool.', err);
	}
	console.log("Connected to database.");
	console.log();
	// TODO - insert query
	// TODO - appropraite way to use connection - stockpile data and insert every so often? insert every time? reconnect each time? maintain open connection?
	client.query('SELECT $1::varchar AS my_first_query', ['cat_platform'], 
		function(err, result) {
			done();
			if(err) {
				return console.error('Error happened during query.', err);
			}
			console.log(result);
			console.log(result.rows[0]);
		});
});

var myRobot = {};

// TODO - uncomment myRobot.local when not needed

//myRobot.local = new dorita980.Local(blid, password, robotIP);
//myRobot.cloud = new dorita980.Cloud(blid, password, robotIP);

console.log("Starting logging of Roomba");
console.log(`  blid: ${blid}`);
console.log(`  password: ${password}`);
console.log(`  robotIP: ${robotIP}`);
console.log(``);

// TODO - establish database connection

function checkConnectionToRoomba() {
	console.log("Connecting to roomba...");
	myRobot.local.getSys().then(function(msg) {
		console.log("Received system info:")
		console.log(util.inspect(msg, { depth: null, colors: true }));
		// TODO - do something with this data.
		pollRoomba();
	});
}

function pollRoomba() {
	console.log("Polling roomba");
	myRobot.local.getMission().then(function(msg) {
		console.log(chalk.red(`mission: `));
		console.log(util.inspect(msg, {depth: null, colors: true}));
		// TODO - store this data in database
		setTimeout(pollRoomba, pollInterval);
	});
}

// TODO - make logs discretionary/discardable

//checkConnectionToRoomba();
