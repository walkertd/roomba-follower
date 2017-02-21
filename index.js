'use strict';

const chalk = require('chalk');
const debug = require('debug')('roombafollower');
var dorita980 = require('dorita980');
var util = require('util');
var pgp = require('pg-promise')();

var robotConfig = require('./config/roomba.json');
var dbConfig = require('./config/db.json');

var blid = robotConfig.blid;
var password = robotConfig.password;
var robotIP = robotConfig.robotIP;
var pollInterval = robotConfig.pollInterval;
var pollTimeout = robotConfig.pollTimeout;

if (!blid || !password) {
	debug('Robot blid or password was not set.');
	throw new Error('Robot config not found. Please edit config/roomba.json file with your robot credentials.');
}

if (!dbConfig.password || !dbConfig.username || !dbConfig.host || !dbConfig.database) {
	debug('Missing element of db connection string.');
	throw new Error('Database config not found. Please edit config/db.json file with your robot credentials.');
}

var connectionString = `postgres://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

debug(`Using connection string: ${connectionString}`);

var db = pgp(connectionString);

var myRobot = {};
var missionNumber = 0;
var missionSequence = 0;
var lastCycle = null;

debug(`Connecting to robot ${blid} at ${robotIP}`);

myRobot.local = new dorita980.Local(blid, password, robotIP);
//myRobot.cloud = new dorita980.Cloud(blid, password, robotIP);

function recordData(data) {
	debug(`Recording data`);
	debug(util.inspect(data, {depth: null, colors: true}));
	var result = db.one("INSERT INTO recordings(${this~}) VALUES (${mission_number}, ${sequence}, ${initiator}, ${cycle}, ${phase}, \
		${elapsed_time}, ${area_cleaned}, ${expirem}, ${rechrgm}, ${notready}, ${error}, ${pose_theta}, ${pose_x}, ${pose_y}, ${bin_present}, ${bin_full}) returning (${this~})", data)
		.then((result) => {
			debug(`Insert returned result.`)
			debug(util.inspect(result, { depth: null, colors: true }));
		});
}


function checkConnectionToRoomba() {
	debug(`Checking connection to roomba...`);
	myRobot.local.getSys().then(function(msg) {
		debug("Received system info:")
		debug(util.inspect(msg, { depth: null, colors: true }));
		pollRoomba();
	});
}

function pollRoomba() {
	debug("Polling roomba");
	myRobot.local.getMission().then(function(msg) {
		debug("Received data");
		debug(util.inspect(msg, {depth: null, colors: true}));
		if(msg.nMssn != missionNumber) {
			debug(`Begun mission ${missionNumber}...`);
			missionNumber = msg.cleanMissionStatus.nMssn;
			missionSequence = 0;
		} 
		if(msg.cleanMissionStatus.cycle != 'none' || lastCycle != 'none') {
			debug(`Writing data to database...`)
			missionSequence = missionSequence + 1;
			lastCycle = msg.cleanMissionStatus.cycle;
			recordData(convertMsgToData(msg));
		}		
		setTimeout(pollRoomba, pollInterval);			
	});
}

function convertDataToMsg(data) {
	var msg = {
		cleanMissionStatus: {
			nMssn: data.mission_number,
			sequence: data.sequence,
			initiator: data.initiator,
			cycle: data.cycle,
			phase: data.phase,
			mssnM: data.elapsed_time,
			sqft: data.area_cleaned,
			expireM: data.expirem,
			rechrgM: data.rechrgm,
			notready: data.notready,
			error: data.error
		},
		pose: {
			theta: data.pose_theta,
			point: {
				x: data.pose_x,
				y: data.pose_y
			}
		},
		bin: {
			present: data.bin_present,
			full: data.bin_full
		}
	};
	return msg;
}

function convertMsgToData(msg) {
	var data = {
		mission_number: msg.cleanMissionStatus.nMssn,
		sequence: missionSequence,
		initiator: msg.cleanMissionStatus.initiator,
		cycle: msg.cleanMissionStatus.cycle,
		phase: msg.cleanMissionStatus.phase,
		elapsed_time: msg.cleanMissionStatus.mssnM,
		area_cleaned: msg.cleanMissionStatus.sqft,
		expirem: msg.cleanMissionStatus.expireM,
		rechrgm: msg.cleanMissionStatus.rechrgM,
		notready: msg.cleanMissionStatus.notReady,
		error: msg.cleanMissionStatus.error,
		pose_theta: msg.pose.theta,
		pose_x: msg.pose.point.x,
		pose_y: msg.pose.point.y,
		bin_present: msg.bin.present,
		bin_full: msg.bin.full
	};
	return data;
}

checkConnectionToRoomba();
