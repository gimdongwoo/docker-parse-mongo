var _ = require('underscore');

// UTIL
var UTIL = require('../cloud/util.js');
var APP = UTIL.APP;
var timestamp = UTIL.timestamp;
var returnNext = UTIL.returnNext;
var delay = UTIL.delay;
var ResponseManager = UTIL.ResponseManager;
var isBanTime = UTIL.isBanTime;

/**
* push for one user
*/
// 알림센터에 데이터 남기기
var createAlarms = function(answersId, pushData) {
  var Alarms = Parse.Object.extend("Alarms");
  var alrams = new Alarms();

  return alrams.set({
    "UserId" : answersId,
    "Data" : pushData,
    "type" : pushData.type
  }).save();
};
module.exports.createAlarms = createAlarms;

// 1명에게 push 발송
var sendPushForOneUser = function(answersId, pushData) {
  // 답변 요구 일때 push 갯수 제한
  if (pushData.type == "RequestAnswer") {
    var beforeTime = new Date();
    beforeTime.setHours(beforeTime.getHours() - 11);

    // 기준 시간 이내에 같은 유형의 push가 있으면 무시
    var alarmsQ = new Parse.Query("Alarms");
    alarmsQ.equalTo("UserId", answersId);
    alarmsQ.equalTo("type", pushData.type);
    alarmsQ.greaterThan("createdAt", beforeTime);
    alarmsQ.notEqualTo("isRead", true); // 읽은건 빼고
    alarmsQ.skip(1);   // 이번에 보낼건 빼고
    alarmsQ.first().then(function(alarms) {
      if (alarms) return returnNext();
      else return sendPushOne(answersId, pushData);
    }, function(error) {
      return sendPushOne(answersId, pushData);
    });
  } else {
    return sendPushOne(answersId, pushData);
  }

  function sendPushOne(answersId, pushData) {
    var promise = new Parse.Promise();

    // banTime check
    var UserQ = new Parse.Query(Parse.User);
    UserQ.get(answersId, { useMasterKey: true }).then(function(user) {
      if (user) {
        //모든 푸쉬에 대해 허가 체크.
        if(!user.get('isPermissionAllPush')) return Parse.Promise.error("All Push deny");

        //방해금지 시간체크.
        if(user.get('isUsingBanTime')){
          var banStartHour = user.get('banStartHour');
          var banStartMinute = user.get('banStartMinute');
          var banEndHour = user.get('banEndHour');
          var banEndMinute = user.get('banEndMinute');
          var timezoneOffset = user.get('timezoneOffset');
          //방해금지 시간이 아닐경우만 푸쉬대상을 사용함.
          if(!isBanTime(timezoneOffset, banStartHour, banStartMinute, banEndHour, banEndMinute)){
            return returnNext(user);
          } else {
            return Parse.Promise.error("Do Not Disturb");
          }
        }else{
          //방해금지 사용하지 않는경우.
          return returnNext(user);
        }
      } else {
        return errorFn("UserMorId is invaild");
      }
    }).then(function(user) {
      // 전송시간 추가
      pushData.createdAt = new Date();

      var pushQuery = new Parse.Query(Parse.Installation);
      //pushQuery.containedIn("User_objectId", [answersId]);
      pushQuery.equalTo("User_objectId", answersId);
      //pushQuery.containedIn("channels", ["Answer"]);
      pushQuery.equalTo("channels", "Answer");

      Parse.Push.send({
        where:pushQuery,
        data:pushData
      },
      {
        useMasterKey: true,
        success: function(results) {
          var msg = 'sending push message for user : '+ answersId;
          // android badge update
          pushQuery.each(function(InstallationM) {
            if (InstallationM.get("deviceType") == "android") {
              InstallationM.increment("badge");
              return InstallationM.save(null, { useMasterKey: true });
            } else {
              return returnNext();
            }
          }, { useMasterKey: true }).then(function() {
            promise.resolve(msg);
          }, function(error) {
            APP.log((typeof request !== "undefined") &&	request, 'error', "sendPushForOneUser error:" + JSON.stringify(error));
            promise.resolve(msg);
          });
        },
        error: errorFn
      });
    }, errorFn);

    function errorFn(error) {
      promise.resolve(error);
    }

    return promise;
  }
};
module.exports.sendPushForOneUser = sendPushForOneUser;

module.exports.sendPush = function (request, response) {
  var pushData = request.params.data || {};

  var query = request.params.query || {};
  var userIds = query.userIds;
  var channels = query.channels;

  var userQuery = new Parse.Query(Parse.User);
  if(userIds){
    userQuery.containedIn("objectId", userIds);
  }

  var targetUserIds = [];
  userQuery.each(function(user) {
    //모든 푸쉬에 대해 허가 체크.
    if(!user.get('isPermissionAllPush')) return returnNext();

    //방해금지 시간체크.
    if(user.get('isUsingBanTime')){
      var banStartHour = user.get('banStartHour');
      var banStartMinute = user.get('banStartMinute');
      var banEndHour = user.get('banEndHour');
      var banEndMinute = user.get('banEndMinute');
      var timezoneOffset = user.get('timezoneOffset');
      //방해금지 시간이 아닐경우만 푸쉬대상을 사용함.
      if(!isBanTime(timezoneOffset, banStartHour, banStartMinute, banEndHour, banEndMinute)){
        targetUserIds.push(user.id);
        return createAlarms(user.id, pushData);
      } else {
        return returnNext();
      }
    }else{
      //방해금지 사용하지 않는경우.
      targetUserIds.push(user.id);
      return createAlarms(user.id, pushData);
    }
  }, { useMasterKey: true }).then(function() {
    //보낼상대가 한명이라도 있어야 push보냄.
    if(targetUserIds.length > 0){
      // 전송시간 추가
      pushData.createdAt = new Date();

      var pushQuery = new Parse.Query(Parse.Installation);
      pushQuery.containedIn("User_objectId", targetUserIds);
      if(channels){
        pushQuery.containedIn("channels", channels);
      }
      Parse.Push.send({
        where:pushQuery,
        data:pushData
      },
      {
        useMasterKey: true,
        success: function(results) {
          var msg = 'sending push message for users : '+ targetUserIds.length;
          response.success(msg);
        },
        error: function(error) {
          response.error(error);
        }
      });
    }else{
      var msg = 'no push sent. because isBanTime!' + request.params;
      response.success(msg);
    }
  }, function(error) {
    APP.log((typeof request !== "undefined") &&	request, 'error', "sendPush error:" + JSON.stringify(error));
    response.error(error);
  });
};
