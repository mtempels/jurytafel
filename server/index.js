/**
 * @fileOverview Bingo Server
 * @name index.js
 * @author Matthijs Tempels <matthijs@townsville.nl>
 * @license Townsville.nl
 */

"use strict";

const logger = require('townsville-logger');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const client = require('https');


/**
 * Main service class
 */
class Service {

  /**
   * Class constructor
   * @param {object} settings Service settings
   */
  constructor(settings) {

    this._init(settings);
  }

  /**
   * Run service
   */
  run() {

  }

  /**
   * Close service
   */
  close() {

  }

  // ---- Private ----

  /**
   * Init class
   * @param {object} settings Settings object
   * @throws {Error} If settings are bad
   */
  _init(settings) {

    // Sanity checks
    if (!settings) {
      throw new Error('Service requires a valid settings object');
    }
    this._log = logger.createLogger('server');

    // Setup express

    app.use('/public', express.static(path.join(__dirname, 'public')));

    app.get('/', (req, res) => {
      res.sendFile(__dirname + '/index.html');
    });

    io.on('connection', (socket) => {
      this._log.debug('a user connected');
      socket.emit('teams message', { "home": settings.home, "guest": settings.guest });
      socket.emit('time message', { "status": "OK", "second": 0, "period": 0, "minute": 0 });
      socket.emit('score message', { "status": "OK", "home": 0, "guest": 0 });
      socket.emit('shotclock message', { "status": "OK", "time": 0 });
      socket.on('disconnect', () => {
        this._log.debug('a user disconnected');
      });
    });

    http.listen(3000, () => {
      this._log.debug('listening on *:3000');
    });

    setInterval(() => {
      client.get(settings.timeurl, (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
          data += chunk;
        });
        resp.on('end', () => {
          try {
            data = JSON.parse(data);
            if (data.status === "OK") {
              io.emit('time message', data);
            }
          } catch (err) {
            // niks mee doen
          }
        });
      }).on("error", (err) => {
        this._log.error("Error: " + err.message);
      });

      client.get(settings.scoreurl, (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
          data += chunk;
        });
        resp.on('end', () => {
          try {
            data = JSON.parse(data);
            if (data.status === "OK") {
              io.emit('score message', data);
            }
          } catch (err) {
            // niks mee doen
          }
        });
      }).on("error", (err) => {
        this._log.error("Error: " + err.message);
      });

      client.get(settings.shotclockurl, (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
          data += chunk;
        });
        resp.on('end', () => {
          try {
            data = JSON.parse(data);
            if (data.status === "OK") {
              io.emit('shotclock message', data);
            }
          } catch (err) {
            // niks mee doen
          }
        });
      }).on("error", (err) => {
        this._log.error("Error: " + err.message);
      });
      io.emit('teams message', { "home": settings.home, "guest": settings.guest });
    }, 200);
  }
}

// Exports
module.exports = Service;