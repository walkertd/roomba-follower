'use strict';

const chalk = require('chalk');
const debug = require('debug')('roombafollower');
var dorita980 = require('dorita980');
var util = require('util');
var pgp = require('pg-promise')();

var robotConfig = require('../config/roomba.json');
var dbConfig = require('../config/db.json');

var blid = robotConfig.blid;
var password = robotConfig.password;
var robotIP = robotConfig.robotIP;
var pollInterval = robotConfig.pollInterval;
var pollTimeout = robotConfig.pollTimeout;
var inactiveRecordingInterval = robotConfig.inactiveRecordingInterval;

// TODO - Support for firmware version 1.x.

if(!pollInterval || !pollTimeout || !inactiveRecordingInterval) {
	debug('Time interval not set.');
	throw new Error('Robot timeout intervals not set.  Please edit config/roomba.json file with your desired timeouts.');
}

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
var lastMsg = null;
var tick = 0;

debug(`Connecting to robot ${blid} at ${robotIP}`);

myRobot.local = new dorita980.Local(blid, password, robotIP);
//myRobot.cloud = new dorita980.Cloud(blid, password, robotIP);

function recordData(data) {
	debug(`Recording data`);
	//debug(util.inspect(data, {depth: null, colors: true}));
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
		//debug(util.inspect(msg, {depth: null, colors: true}));
		if(msg.cleanMissionStatus.nMssn != missionNumber) {
			missionNumber = msg.cleanMissionStatus.nMssn;
			debug(`Begun mission ${missionNumber}...`);
			missionSequence = 0;
		}
		if(!checkMessageEquality(msg, lastMsg)) {
			debug('Message payload differs from last.  Resetting tick counter.');
			tick = 0;
			lastMsg = msg;
		}
		if(msg.cleanMissionStatus.phase == 'run' || tick % inactiveRecordingInterval == 0) {
			debug(`Writing data to database...`)
			missionSequence = missionSequence + 1;
			var data = convertMsgToData(msg);
			data.sequence = missionSequence;
			recordData(data);
		}
		tick = tick + 1;
		setTimeout(pollRoomba, pollInterval);			
	});
}

function convertDataToMsg(data) {
	var msg = {
		cleanMissionStatus: {
			nMssn: data.mission_number,
			time_stamp: data.time_stamp,
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

function checkMessageEquality(msg1, msg2) {
	if(msg1 == null || msg2 == null)
		return false;
	return msg1.cleanMissionStatus.nMssn == msg2.cleanMissionStatus.nMssn &&
		   msg1.cleanMissionStatus.initiator == msg2.cleanMissionStatus.initiator &&
		   msg1.cleanMissionStatus.cycle == msg2.cleanMissionStatus.cycle &&
		   msg1.cleanMissionStatus.phase == msg2.cleanMissionStatus.phase &&
		   msg1.cleanMissionStatus.mssnM == msg2.cleanMissionStatus.mssnM &&
		   msg1.cleanMissionStatus.sqft == msg2.cleanMissionStatus.sqft &&
		   msg1.cleanMissionStatus.expireM == msg2.cleanMissionStatus.expireM &&
		   msg1.cleanMissionStatus.rechrgM == msg2.cleanMissionStatus.rechrgM &&
		   msg1.cleanMissionStatus.notReady == msg2.cleanMissionStatus.notReady &&
		   msg1.cleanMissionStatus.error == msg2.cleanMissionStatus.error &&
		   msg1.pose.theta == msg2.pose.theta &&
		   msg1.pose.point.x == msg2.pose.point.x &&
		   msg1.pose.point.y == msg2.pose.point.y &&
		   msg1.bin.present == msg2.bin.present &&
		   msg1.bin.full == msg2.bin.full;		   		
}

checkConnectionToRoomba();
