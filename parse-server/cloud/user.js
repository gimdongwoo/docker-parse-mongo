var _ = require('underscore');

// UTIL
var UTIL = require('../cloud/util.js');
var APP = UTIL.APP;
var timestamp = UTIL.timestamp;
var returnNext = UTIL.returnNext;
var delay = UTIL.delay;
var ResponseManager = UTIL.ResponseManager;
var getUserObject = UTIL.getUserObject;

module.exports.findUsers = function(request, response) {
  var params = request.params || {};
  var username = params.username || "";
  var query = new Parse.Query(Parse.User);
  query.equalTo("username", username);  // find all the women
  query.find({ useMasterKey: true }).then(function(results) {
    response.success(results);
  }, function(error) {
    response.error(error);
  });
};

module.exports.signUpUser = function(request, response) {
  var params = request.params || {};
  var user = new Parse.User();
  user.signUp(params).then(function(user) {
    response.success(user);
  }, function(error) {
    response.error(error);
  });
};

module.exports.userModify = function(request, response) {
  var user = request.user;
  if (!user) {
    response.error();
    return;
  }

  var _attributes = {};
  // remove like "_RevocableSession"
  _.each(request.params, function(val, key) {
    if (key.indexOf('_') != 0) {
      _attributes[key] = val;
    }
  });

  user.save(_attributes, { useMasterKey: true }).then(function() {
    return getUserObject(user.id);
  }).then(function(userDataR) {
    response.success(userDataR);
  }, function(error) {
    APP.log((typeof request !== "undefined") &&	request, 'error', "userModify save error:" + JSON.stringify(error));
    response.error(error);
  });
};

module.exports.changeUserName = function(request, response) {
  var userM = request.user;
  var newName = request.params.name || '';
  var modifyNameAt = request.params.modifyNameAt || '';

  if(!userM) { return errorFn({ message: 'loginUser is not exists '}); }

  if(!newName){
    errorFn("empty");
  }else{
    var userQ = new Parse.Query(Parse.User);
    userQ.equalTo('name', newName);
    userQ.notEqualTo('objectId', userM.id); //나외에
    userQ.find({ useMasterKey: true })
    .then(function(results) {
      //존재시에는 중복에러. 에러.
      if(results && results.length){
        return errorFn("duplicate");
      }else{
        userM.save({ "name" : newName, "modifyNameAt" : modifyNameAt }, { useMasterKey: true })
        .then(function() {
          response.success("Success");
        }, errorFn);
      }
    }, errorFn)
  }

  function errorFn(error) {
    APP.log((typeof request !== "undefined") &&	request, 'error', "changeUserName error:" + JSON.stringify(error));
    response.error(error); return;
  }
};
