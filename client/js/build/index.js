"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var API_BASE = "https://api.fl33t.com";

var fl33t = function () {
  function fl33t(sessionToken, teamId) {
    _classCallCheck(this, fl33t);

    this.baseURL = API_BASE + '/team/' + teamId;
    this.sessionToken = sessionToken;
  }

  _createClass(fl33t, [{
    key: "checkin",
    value: function checkin(deviceId, buildId) {
      var url = "/device/" + deviceId + "/checkin";
      var checkin = { 'checkin': { 'build_id': '' } };
      if (buildId !== undefined) {
        checkin.checkin.build_id = buildId;
      }
      return this.post(url, checkin);
    }
  }, {
    key: "post",
    value: function post(url, data) {
      var _this = this;

      return fetch(this.baseURL + url, {
        method: "post",
        headers: {
          "Content-type": "application/json",
          Authorization: "Bearer " + this.sessionToken
        },
        body: JSON.stringify(data)
      }).then(function (response) {
        return _this.handleResponse(response, url);
      }).catch(function (error) {
        return _this.handleResponse(error, url);
      });
    }
  }, {
    key: "put",
    value: function put(url, data) {
      var _this2 = this;

      return fetch(this.baseURL + url, {
        method: "put",
        headers: {
          "Content-type": "application/json",
          Authorization: "Bearer " + this.sessionToken
        },
        body: JSON.stringify(data)
      }).then(function (response) {
        return _this2.handleResponse(response, url);
      }).catch(function (error) {
        return _this2.handleResponse(error, url);
      });
    }
  }, {
    key: "get",
    value: function get(url) {
      var _this3 = this;

      return fetch(this.baseURL + url, {
        headers: { Authorization: "Bearer " + this.sessionToken }
      }).then(function (response) {
        return _this3.handleResponse(response, url);
      }).catch(function (error) {
        return _this3.handleResponse(error, url);
      });
    }
  }, {
    key: "del",
    value: function del(url) {
      var _this4 = this;

      return fetch(this.baseURL + url, {
        method: "delete",
        headers: { Authorization: "Bearer " + this.sessionToken }
      }).then(function (response) {
        return _this4.handleResponse(response, url);
      }).catch(function (error) {
        return _this4.handleResponse(error, url);
      });
    }
  }, {
    key: "handleResponse",
    value: function handleResponse(response, url) {
      if (response.ok) {
        var contentType = response.headers.get("Content-Type") || "";

        if (contentType.includes("application/json")) {
          return response.json().catch(function (error) {
            return Promise.reject(new Error("Invalid JSON: " + error.message));
          });
        }
      } else {
        return Promise.reject(response);
      }
    }
  }]);

  return fl33t;
}();

exports.default = fl33t;