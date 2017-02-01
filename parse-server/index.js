// Example express application adding the parse-server module to expose Parse
// compatible API routes.

// parse server
var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');
var S3Adapter = require('parse-server').S3Adapter;

// parse dashboard
var ParseDashboard = require('parse-dashboard');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

// parse server
var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  masterKey: process.env.MASTER_KEY || '', //Add your master key here. Keep it secret!
  fileKey: process.env.FILE_KEY || '', // Add the file key to provide access to files already hosted on Parse
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  },
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
  //   process.env.S3_BUCKET,
  //   {
  //     region: process.env.S3_REGION,
  //     directAccess: process.env.S3_DIRECT_ACCESS
  //   }
  // )
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

// parse dashboard
var dashboard = new ParseDashboard({
  apps: [
    {
      appId: process.env.APP_ID || 'myAppId',
      masterKey: process.env.MASTER_KEY || 'myMasterKey',
      serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',
      appName: process.env.APP_NAME || 'MyApp',
    }
  ],
  users: [
    {
      user: process.env.ADM_USER || '',
      pass: process.env.ADM_PASS || ''
    }
  ]
}, true); // allowInsecureHTTP

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('Make sure to star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

// make the Parse Dashboard available at /dashboard
app.use('/dashboard', dashboard);

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
