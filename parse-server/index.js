// Example express application adding the parse-server module to expose Parse
// compatible API routes.

// parse server
var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');
var S3Adapter = require('parse-server').S3Adapter;

// config
var PARSE_CONFIG = JSON.parse((process.env.PARSE_CONFIG).replace(/'/gi, "\""));

// parse dashboard
var ParseDashboard = require('parse-dashboard');

// express
var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// create api server
var PARSE_APP = PARSE_CONFIG.apps[0];
if (!PARSE_APP.databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

// parse server
var api = new ParseServer({
  databaseURI: PARSE_APP.databaseUri || 'mongodb://localhost:27017/dev',
  cloud: PARSE_APP.cloudCodeMain || __dirname + '/cloud/main.js',
  appId: PARSE_APP.appId || 'myAppId',
  masterKey: PARSE_APP.masterKey || '', //Add your master key here. Keep it secret!
  fileKey: PARSE_APP.fileKey || '', // Add the file key to provide access to files already hosted on Parse
  serverURL: PARSE_APP.localServerURL || PARSE_APP.serverURL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
  // liveQuery: {
  //   classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  // },
  // push: {
  //   android: { senderId: process.env.GCM_SENDER_ID, apiKey: process.env.GCM_API_KEY },
  //   ios: [
  //     { pfx: __dirname + "/push/aps_development.p12", bundleId: process.env.APP_BUNDLE_ID, production: false },
  //     { pfx: __dirname + "/push/aps_production.p12", bundleId: process.env.APP_BUNDLE_ID, production: true }
  //   ]
  // },
  // filesAdapter: new S3Adapter(
  //   process.env.S3_ACCESS_KEY,
  //   process.env.S3_SECRET_KEY,
  //   PARSE_APP.s3Bucket,
  //   {
  //     region: process.env.S3_REGION,
  //     directAccess: process.env.S3_DIRECT_ACCESS
  //   }
  // )
});

// Serve the Parse API on the /parse URL prefix
var mountPath = PARSE_APP.mountPath || '/parse';
app.use(mountPath, api);

// cron jobs for production
if (process.env.NODE_ENV == "production") {
  // Parse for node client
  var Parse = require('parse/node').Parse;
  Parse.initialize(PARSE_APP.appId || 'myAppId', null, PARSE_APP.masterKey || '');
  Parse.serverURL = PARSE_APP.localServerURL || PARSE_APP.serverURL || 'http://localhost:1337/parse';

  // [ CronJob ]
  // Seconds: 0-59
  // Minutes: 0-59
  // Hours: 0-23
  // Day of Month: 1-31
  // Months: 0-11
  // Day of Week: 0-6

  // cronjob set
  var CloudCode = require('./src/CloudCode');
  var crond = new CloudCode(Parse, 'Asia/Seoul');

  // backgroundJob
  crond.putJob("backgroundJob", null);
  crond.addCron("backgroundJob", "0 */15 * * * *");  // per 15 minutes

  //start
  crond.start();
}

// parse dashboard
var dashboard = new ParseDashboard(PARSE_CONFIG, true); // allowInsecureHTTP

// make the Parse Dashboard available at /dashboard
app.use('/dashboard', dashboard);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('Make sure to star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
// ParseServer.createLiveQueryServer(httpServer);
