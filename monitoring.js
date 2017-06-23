/*jshint esversion: 6 */
var Monitoring = function() {
    // Command line
    let env = process.argv.length > 2 ? process.argv[2] : 'prod';

    // Imports
    const util = require('util');
    const fs = require('fs');
    const moment = require('moment');
    const Client = require('node-rest-client').Client;
    const client = new Client();

    // Default data
    const urlBase = 'https://desafioperformance.b2w.io';
    const urlIdDesafio = '/5937033f0ad29c0007185f0a';
    const urlReinicia = '/reinicia';
    this.urlBairros = '/bairros'; // public for testing

    // Controls variables
    let defaultInterval = env === 'dev' ? 10 : 60; // Seconds
    let timeToExec = env === 'dev' ? 120 : 1200; // Seconds
    let friendlyFormat = 'DD/MM/YYYY hh:mm:ss';
    let timestampFormat = env === 'dev' ? 'YYYY-MM-DD hh:mm:ss' : 'YYYY-MM-DD hh:mm';
    let log = '';
    let lastUpdated = new Date();
    let stopTime = moment(lastUpdated).add(timeToExec, 'seconds');
    let statusData = {
        '2xx': 0,
        '4xx': 0,
        '5xx': 0
    };

    // Aux methods
    var resetData = function() {
        statusData = {
            '2xx': 0,
            '4xx': 0,
            '5xx': 0
        };

        lastUpdated = moment.now();
    };

    var getStatusFamily = function(status) {
        return parseInt(status / 100);
    };

    var saveFile = function() {
        fs.writeFile("results.csv", log, function(err) {
            if (err) {
                return console.log(err);
            }

            console.log("The file was saved!");
        });
    };

    // Requests
    this.doBairrosRequest = function(cb) {
        let url = urlBase + this.urlBairros;

        client.get(url, function(data, response) {
            cb(getStatusFamily(response.statusCode));
        });
    };

    this.doReiniciaRequest = function(cb) {
        console.log('Restarting ...');
        let url = urlBase + urlReinicia;
        var args = {
            headers: { "Content-Type": "application/json" }
        };

        client.put(url, args, function(data, response) {
            console.log(response.statusMessage);

            if (cb) {
                cb(response.statusCode);
            }
        });
    };

    // App

    this.start = function() {
        var exec = null;
        var self = this;


        console.log('Env ' + env);
        console.log(util.format('Starting %s, should finish %s', moment(lastUpdated).format(friendlyFormat), moment(stopTime).format(friendlyFormat)));

        var checkStatus = function() {
            // Listen by n seconds and stops the app
            let seconds = moment(new Date()).diff(moment(stopTime), 'seconds');
            console.log(seconds);

            if (seconds > 0) {
                console.log('Stopping');
                clearInterval(exec);
                saveFile();
            }

            self.doBairrosRequest(function(status) {
                statusData[status + 'xx'] = statusData[status + 'xx'] + 1;

                let now = new Date();
                var diff = moment(now).diff(lastUpdated, 'seconds');

                if (diff >= defaultInterval) {
                    let timestamp = moment(now).format(timestampFormat);
                    let actualLog = util.format('%s,%s,%s,%s\n', timestamp, statusData['2xx'], statusData['4xx'], statusData['5xx']);
                    log += actualLog;

                    console.log(actualLog);
                    resetData();

                    if (statusData['2xx'] < statusData['5xx']) {
                        self.doReiniciaRequest();
                    }
                }
            });
        };

        exec = setInterval(checkStatus, 2000);
    };
};

module.exports = Monitoring;