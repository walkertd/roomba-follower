'use strict';

var pgp = require('pg-promise')();
var dbConfig = require('../config/db.json');

if (!dbConfig.password || !dbConfig.username || !dbConfig.host || !dbConfig.database) {
	debug('Missing element of db connection string.');
	throw new Error('Database config not found. Please edit config/db.json file with your robot credentials.');
}

var connectionString = `postgres://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
var db = pgp(connectionString);

module.exports = {
	pgp,
	db
};