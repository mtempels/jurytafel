/**
 * @fileOverview Main Server
 * @name index.js
 * @author Matthijs Tempels <matthijs@townsville.nl>
 * @license Townsville.nl
 */

"use strict";

const logger = require('townsville-logger');
const util = require('util');

//setup express
const express = require('express');
const bodyParser = require("body-parser");
const router = express.Router();
const app = express();
const http = require('http').createServer(app);

const io = require('socket.io')(http);
const path = require('path');

const i2c = require('i2c-bus');
const i2cBus = i2c.openSync(1);
const oled = require('oled-i2c-bus');
const si = require('systeminformation');

const opts = {
  width: 128,
  height: 64,
  address: 0x3C
};

const Oled = new oled(i2cBus, opts);




const httpclient = require('http');
const httpsclient = require('https');

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

/**
 * Main service class
 */
class Service {

  /**
   * Class constructor
   * @param {object} settings Service settings
   */
  constructor(settings, nconf) {
    this._init(settings, nconf);
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
  _init(settings, nconf) {

    Oled.clearDisplay();
    Oled.setCursor(1, 1);
    si.networkInterfaceDefault((defaultif) => {
      si.networkInterfaces((data) => {
        data.forEach(element => {
          if (element.iface === "defaultif") {
            Oled.writeString(font, 1, "IP: " + element.ip4);
          }
        });
      });
    });

    // Sanity checks
    if (!settings) {
      throw new Error('Service requires a valid settings object');
    }
    this._log = logger.createLogger('jurytafel');

    // Setup express

    app.use('/public', express.static(path.join(__dirname, 'public')));

    app.get('/', (req, res) => {
      res.render(__dirname + '/index.html', settings);
    });

    app.get('/admin', (req, res) => {
      res.render(__dirname + '/admin.html', settings);
    });

    app.post('/admin', (req, res) => {
      nconf.set("serviceSettings:clientType", req.body.clientType);
      nconf.set("serviceSettings:timeURL", req.body.timeURL);
      nconf.set("serviceSettings:scoreURL", req.body.scoreURL);
      nconf.set("serviceSettings:shotclockURL", req.body.shotclockURL);
      nconf.set("serviceSettings:home", req.body.home);
      nconf.set("serviceSettings:guest", req.body.guest);
      nconf.set("serviceSettings:host", req.body.host);
      nconf.set("serviceSettings:port", (1 * req.body.port));

      settings.clientType = req.body.clientType
      settings.timeURL = req.body.timeURL
      settings.scoreURL = req.body.scoreURL
      settings.shotclockURL = req.body.shotclockURL
      settings.home = req.body.home
      settings.guest = req.body.guest
      settings.host = req.body.host
      settings.port = (1 * req.body.port)

      nconf.save((err) => {
        res.render(__dirname + '/saved.html', settings);
      });
    });

    io.on('connection', (socket) => {
      socket.emit('teams message', {
        "home": settings.home,
        "guest": settings.guest
      });
      socket.emit('time message', {
        "status": "OK",
        "second": 0,
        "period": 0,
        "minute": 0
      });
      socket.emit('score message', {
        "status": "OK",
        "home": 0,
        "guest": 0
      });
      socket.emit('shotclock message', {
        "status": "OK",
        "time": 0
      });
    });

    http.listen(settings.port, settings.host, () => {
      this._log.debug(util.format('listening on %s:%s', settings.host, settings.port));
    });

    // pick the right client
    var client;
    if (settings.clientType == "http") {
      client = httpclient;
    } else if (settings.clientType == "https") {
      client = httpsclient;
    } else {
      this._log.error("invalid clientType in config");
      process.exit(1);
    }

    setInterval(() => {
      client.get(settings.timeURL, (resp) => {
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

      client.get(settings.scoreURL, (resp) => {
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

      client.get(settings.shotclockURL, (resp) => {
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
      io.emit('teams message', {
        "home": settings.home,
        "guest": settings.guest
      });
    }, 200);
  }
}

// Exports
module.exports = Service;