var _ = require('underscore');

// UTIL
var UTIL = require('../cloud/util.js');
var APP = UTIL.APP;
var returnNext = UTIL.returnNext;
var delay = UTIL.delay;
var ResponseManager = UTIL.ResponseManager;
var isBanTime = UTIL.isBanTime;

/********************************************************************************************************************************************
* Installation
********************************************************************************************************************************************/
/**
* query installation object using randomId
*/
Parse.Cloud.define("getInstallationByObjectId", function(request, response) {
  require('../cloud/util.js').getInstallationByObjectId(request, response);
});


/********************************************************************************************************************************************
* SignUp
********************************************************************************************************************************************/
/**
* find user for join process
*/
Parse.Cloud.define("findUsers", function(request, response) {
  require('../cloud/user.js').findUsers(request, response);
});

/**
* signup user for join process
*/
Parse.Cloud.define("signUpUser", function(request, response) {
  require('../cloud/user.js').signUpUser(request, response);
});


/********************************************************************************************************************************************
* User
********************************************************************************************************************************************/
/**
* modify user info
*/
Parse.Cloud.define("userModify", function(request, response) {
  require('../cloud/user.js').userModify(request, response);
});

//change userName ,if newName is unique.
Parse.Cloud.define("changeUserName", function(request, response) {
  require('../cloud/user.js').changeUserName(request, response);
});


/********************************************************************************************************************************************
* Push for Client
********************************************************************************************************************************************/
// send push Notification
Parse.Cloud.define("sendPush", function(request, response) {
  require('../cloud/push.js').sendPush(request, response);
});


/********************************************************************************************************************************************
* Triggers
********************************************************************************************************************************************/
// user delete blocking
Parse.Cloud.beforeDelete(Parse.User, function(request, response) {
  response.error("Error : User delete blocking.");
});

// installation management
Parse.Cloud.beforeSave(Parse.Installation, function(request, response) {
  var responseManager = new ResponseManager(response);

  // channels default value
  if (!request.object.get("channels")) {
    request.object.set("channels", ["Chat","Event","Answer"]);
  }

  var androidId = request.object.get("androidId");
  if (androidId == null || androidId == "") {
    APP.log((typeof request !== "undefined") &&	request, 'warn', "No androidId found, exit");
  } else {
    responseManager.addCount();

    var query = new Parse.Query(Parse.Installation);
    query.equalTo("deviceType", "android");
    query.equalTo("appIdentifier", request.object.get("appIdentifier"));
    query.equalTo("androidId", androidId);
    query.each(function(installationM) {
      if (installationM.get("installationId") != request.object.get("installationId")) {
        return installationM.destroy({ useMasterKey: true });
      } else {
        APP.log((typeof request !== "undefined") &&	request, 'warn', "Current App id " + installationM.get("installationId") + ", dont delete");
        return returnNext();
      }
    }, { useMasterKey: true }).then(function() {
      responseManager.doCallback();
    }, function(error) {
      APP.log((typeof request !== "undefined") &&	request, 'error', "Installation beforeSave error:" + JSON.stringify(error));
      responseManager.doCallback();
    });
  }

  responseManager.doCallback();
});

// User Push 전송 기본값
Parse.Cloud.beforeSave(Parse.User, function(request, response) {
  var responseManager = new ResponseManager(response);

  if (!request.object.get("isPermissionAllPush") == null) {
    request.object.set("isPermissionAllPush", true);
  }
  if (request.object.get("isUsingBanTime") == null) {
    request.object.set("isUsingBanTime", true);
    request.object.set("banStartHour", 23);
    request.object.set("banStartMinute", 0);
    request.object.set("banEndHour", 7);
    request.object.set("banEndMinute", 0);
  }

  responseManager.doCallback();
});
