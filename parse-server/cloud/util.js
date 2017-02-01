var _ = require('underscore');

/**
 * logger
*/
var log = function(_request, _severity, _text, _text1, _text2, _text3, _text4, _text5) {
  var fn = console.log;
  // var fnP = _request && _request.log;
  var pref = "";
  var _severity = _severity ? _severity.toLowerCase() : "info";
  switch(_severity) {
    case "info":
      pref = "[INFO] ";
      break;
    case "error":
      fn = console.error;
      pref = "[ERROR] ";
      break;
    case "warn":
      pref = "[WARN] ";
      break;
    case "verbose":
      pref = "[VERBOSE] ";
      break;
    case "debug":
      pref = "[DEBUG] ";
      break;
    case "silly":
      pref = "[SILLY] ";
      break;
  }
  _text && _.isObject(_text) && (_text = JSON.stringify(_text));
  _text1 && _.isObject(_text1) && (_text1 = JSON.stringify(_text1));
  _text2 && _.isObject(_text2) && (_text2 = JSON.stringify(_text1));
  _text3 && _.isObject(_text3) && (_text3 = JSON.stringify(_text1));
  _text4 && _.isObject(_text4) && (_text4 = JSON.stringify(_text1));
  _text5 && _.isObject(_text5) && (_text5 = JSON.stringify(_text1));

  var content = pref + " " + (_text ? _text + " " : "") + (_text1 ? _text1 + " " : "") + (_text2 ? _text2 + " " : "") + (_text3 ? _text3 + " " : "") + (_text4 ? _text4 + " " : "") + (_text5 ? _text5 + " " : "");

  if (_request && _request.jobManager) _request.jobManager.log(content);

  if (process.env.NODE_ENV == "production" && _severity == "debug") return;
  // return fnP ? fnP(_severity, content) : fn(content);
  return fn(content);
}
module.exports.log = log;

/**
 * singleton core
*/
var APP = {
  "log": log
};
module.exports.APP = APP;

/**
 * get unix timestamp
*/
module.exports.timestamp = function() {
  return Math.floor(new Date().getTime() / 1000);
}

/**
* promise next
*/
module.exports.returnNext = function(_object) {
  return Parse.Promise.as(_object);
}

/**
* promise error
*/
module.exports.returnError = function(_object) {
  APP.log((typeof request !== "undefined") &&	request, 'error', _object);
  return Parse.Promise.error(_object);
}

/**
* delay using promise (setTimeout didn't support)
*/
var delay = function(delayTime) {
  // var delayUntil;
  var delayPromise;

  var _delay = function () {
    // if (Date.now() >= delayUntil) {
    //   delayPromise.resolve();
    //   return;
    // } else {
    //   process.nextTick(_delay);
    // }
    setTimeout(function(){
      delayPromise.resolve();
    }, delayTime);
  }

  // delayUntil = Date.now() + delayTime;
  delayPromise = new Parse.Promise();
  _delay();
  return delayPromise;
};
module.exports.delay = delay;

/**
* serial work in trigger management class
*/
var ResponseManager = function(response) {
  this._response = response;
  this._queCount = 1;
  this._doReturn = false;

  this._bindThis();
}
ResponseManager.prototype.addCount = function () {
  ++this._queCount;
  return this._queCount;
};
ResponseManager.prototype.doCallback = function () {
  --this._queCount;
  if (!this._doReturn && parseInt(this._queCount) <= 0) {
    this._doReturn = true;
    this._response.success();
  }
};
ResponseManager.prototype._bindThis = function () {
  this.addCount = this.addCount.bind(this);
  this.doCallback = this.doCallback.bind(this);
};

module.exports.ResponseManager = ResponseManager;

/**
* check deny push time from user's setting
*/
module.exports.isBanTime = function(timezoneOffset, startHour, startMinute, endHour, endMinute) {
  var currentTimeZoneOffsetInHours = timezoneOffset / 60;
  var nowTime = new Date();

  //각 시간을 utc시간으로 변환. 날짜는 같게만듬.
  //서버시간을 utc로 변환시킴.
  var diffTime = new Date(2015, 4, 10, nowTime.getUTCHours(), nowTime.getUTCMinutes());
  diffTime.setDate(1);
  //유저의 타임존 설정기준에 맞추어 utc시간으로 변환.
  var banStartTime = new Date(2015, 4, 10, (startHour+currentTimeZoneOffsetInHours), startMinute);
  banStartTime.setDate(1);
  var banEndTime = new Date(2015, 4, 10, (endHour+currentTimeZoneOffsetInHours), endMinute);
  banEndTime.setDate(1);

  var isPushBlock = false;

  if (banStartTime > banEndTime) {
    //역순이면 정순으로 만들어줌
    banEndTime.setDate(banEndTime.getDate() + 1); // 4.1 14:30 + 1D = 4.2 14:30
  }

  //오늘거 비교
  if (banStartTime <= diffTime && diffTime <= banEndTime) { // 4.2 04:30 ~ 4.2 14:30
    // 방해금지 시간안에 들어감
    isPushBlock = true;
  }

  //내일거 비교
  diffTime.setDate(diffTime.getDate() + 1);  // 4.3 13:00
  if (banStartTime <= diffTime && diffTime <= banEndTime) {
    // 방해금지 시간안에 들어감
    isPushBlock = true;
  }

  return isPushBlock;
};

// user includes data
module.exports.getUserObject = function(_userId) {
  var userQ = new Parse.Query(Parse.User);
  userQ.include("Childrens.School");
  // userQ.equalTo("objectId", userM.id);
  return userQ.get(_userId, { useMasterKey: true }).then(function(userR) {
    // 전개해서 보내기...
    var userData = _.extend({ id : userR.id, objectId: userR.id}, userR.attributes);
    var Childrens = [];
    _.each(userR.get("Childrens"), function(Children) {
      var ChildrenObj = _.extend({ id : Children.id, objectId: Children.id}, Children.attributes);
      ChildrenObj.School = _.extend({ id : Children.get("School").id, objectId: Children.get("School").id}, Children.get("School").attributes);
      Childrens.push(ChildrenObj);
    });
    userData.Childrens = Childrens;
    var userDataR = { "id" : userR.id, "attributes" : userData };
    return Parse.Promise.as(userDataR);
  });
};

module.exports.getInstallationByObjectId = function(request, response) {
  var objectId = request.params.objectId || '';
  var retryCount = 0;

  var qObjectId = new Parse.Query(Parse.Installation);
  qObjectId.equalTo("objectId", objectId);

  var qInstallationId = new Parse.Query(Parse.Installation);
  qInstallationId.equalTo("installationId", objectId);

  var query = Parse.Query.or(qObjectId, qInstallationId);

  _doQuery(query);

  function _doQuery(query) {
    query.first({ useMasterKey: true }).then(function(result) {
      if(result){
        response.success(result);
      }else{
        delay(100).then(function() {
          if (retryCount < 30) {
            retryCount++;
            _doQuery(query);
          } else {
            errorFn("retryCount over 30");
          }
        });
      }
    }, errorFn);
  }

  function errorFn(error) {
    APP.log((typeof request !== "undefined") &&	request, 'error', "getInstallationByObjectId error:" + JSON.stringify(error));
    response.success(JSON.stringify(error));
  }
};
