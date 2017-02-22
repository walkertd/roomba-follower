'use strict';

const debug = require('debug')('roombafollower');
var app = require('../app.js');
var http = require('http');
var https = require('https');


// Create HTTP server

var config = require('../config/webserver.json');
var port = config.port;

if(!port) {
	debug('Port not set.');
	throw new Error('Web server port not set.  Please edit config/webserver.json file with your desired port.');
}

app.set('port', port);

var server = http.createServer(app);

server.on('listening', () => {
    debug(`Listening on port ${server.address().port}`);        
});
server.on('error', (error) => {
    debug(`Request resulted in error: ${error.message}`);
});
server.listen(port);

// Create HTTPS server

var httpsPort = config.httpsport;
var sslCertificateFile = config.sslCertificateFile;
var sslKeyFile = config.sslKeyFile;

// TODO - test SSL support.  This is just based on the express and https reference information.

if(!(!httpsPort && !sslCertificateFile && !sslKeyFile)) {
    var SSLoptions = {
        key: fs.readFileSync(sslKeyFile),
        cert: fs.readFileSync(sslCertificateFile)
    }
    var httpsServer = https.createServer(SSLoptions, app);
    httpsServer.on('listening', () => {
        debug(`Listening on port ${server.address().port}`);        
    });
    httpsServer.on('error', (error) => {
        debug(`Request resulted in error: ${error.message}`);
    });
    https.listen(httpsPort);
}

