===
OA Jurytafel!


### Install
Use git-hub(ssh):
	
	* install a version of node >= 12
	* sudo npm -g install mtempels/jurytafel
	* When installing as root, use the additional option --unsafe-perm
	* optionally to create upstart/systemd service:
	* sudo npm -g explore jurytafel -- npm run setup
### config
in the config file you can edit the 3 urls to get the basic information from the raspberry's
you also set the home and away teamname

```
{
  "serviceSettings": {
    "timeurl":"https://www.townsville.nl/oa/scorebord/time/",
    "scoreurl":"https://www.townsville.nl/oa/scorebord/score/",
    "shotclockurl":"https://www.townsville.nl/oa/shotclock/time/",
    "home": "OA",
    "guest": "LDODK"
  },
  "logSettings": {
    "name": "jurytafel-server",
    "showName": true,
    "level": "debug",
    "levels": {
      "json-rest-server": "debug"
    },
    "console": {
      "colorize": true
    },
    "file": {
      "path": "/tmp/jurytafel-server.log",
      "rollingFile": {
        "maxSize": 10000000,
        "maxFiles": 20
      }
    },
    "_syslog": {
      "_host": "localhost",
      "_port": 514
    }
  }
}
```
