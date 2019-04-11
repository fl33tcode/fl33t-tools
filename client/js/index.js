"use strict";
let API_BASE = "https://api.fl33t.com";
if (window.fetch === undefined) {
    window.fetch = require('node-fetch');
}

export default class fl33t {
  constructor(sessionToken, teamId){
    this.baseURL = API_BASE + '/team/' + teamId;
    this.sessionToken = sessionToken;
  }

  checkin(deviceId, buildId) {
      let url = "/device/" + deviceId + "/checkin";
      let checkin = {'checkin':{}};
      if (buildId !== undefined) {
        checkin.checkin.build_id = buildId;
      }
      return this.post(url, checkin);
  }

  getTrains() {
      let url = "/trains";
      return this.get(url);
  }

  getBuilds(trainId, options) {
      if (!options) {
          options = {};
      }
      let url = "/builds?train_id=" + trainId;
      if (options.limit) {
          url += '&limit=' + options.limit;
      }
      return this.get(url);
  }

  post(url, data) {
    return fetch(this.baseURL + url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + this.sessionToken
      },
      body: JSON.stringify(data)
    })
      .then(response => {
        return this.handleResponse(response, url);
      })
      .catch(error => {
        return this.handleResponse(error, url);
      });
  }

  put(url, data) {
    return fetch(this.baseURL + url, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + this.sessionToken
      },
      body: JSON.stringify(data)
    })
      .then(response => {
        return this.handleResponse(response, url);
      })
      .catch(error => {
        return this.handleResponse(error, url);
      });
  }

  get(url) {
    return fetch(this.baseURL + url, {
      headers: { "Authorization": "Bearer " + this.sessionToken }
    })
      .then(response => {
        return this.handleResponse(response, url);
      })
      .catch(error => {
        return this.handleResponse(error, url);
      });
  }

  del(url) {
    return fetch(this.baseURL + url, {
      method: "delete",
      headers: { "Authorization": "Bearer " + this.sessionToken }
    })
      .then(response => {
        return this.handleResponse(response, url);
      })
      .catch(error => {
        return this.handleResponse(error, url);
      });
  }

  handleResponse(response, url) {
    if (response.ok) {
      const contentType = response.headers.get("Content-Type") || "";

      if (contentType.includes("application/json")) {
        return response.json().catch(error => {
          return Promise.reject(new Error("Invalid JSON: " + error.message));
        });
      }
    } else {
      return Promise.reject(response);
    }
  }
}
