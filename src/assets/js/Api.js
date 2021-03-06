class Api {
  static get baseUrl() {
    return 'http://127.0.0.1:8080/api';
  }

  static get timeout() {
    return 60 * 1000;
  }

  static fetch(url, init, controller) {
    return new Promise((resolve, reject) => {
      controller = controller || new AbortController();
      setTimeout(() => controller.abort(), Api.timeout);
      init.signal = controller.signal

      fetch(url, init)
          .then(response => {
            return response.json();
          })
          .then(data => {
            if (data.error)
              reject(data.error);
            else
              resolve(data);
          })
          .catch(error => {
            reject({ "code": 99, "description": error.message.toLowerCase() });
          });
    });
  }

  static get(url) {
    return Api.fetch(url, {})
  }

  static post(url, data) {
    return Api.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(data)
    });
  }

  static put(url, data) {
    return Api.fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(data)
    });
  }

  static delete(url) {
    return Api.fetch(url, {
      method: 'DELETE',
    });
  }
}

Api.deviceType = class {

  static get url() {
    return `${Api.baseUrl}/devicetypes`;
  }

  static get(id) {
    return Api.get(`${Api.deviceType.url}/${id}`);
  }

  static getAll() {
    return Api.get(Api.deviceType.url);
  }
}

Api.room = class {
  static get url() {
    return `${Api.baseUrl}/rooms`;
  }

  static add(room) {
    return Api.post(Api.room.url, room);
  }

  static modify(room) {
    return Api.put(`${Api.room.url}/${room.id}`, room);
  }

  static delete(id) {
    return Api.delete(`${Api.room.url}/${id}`);
  }

  static get(id) {
    return Api.get(`${Api.room.url}/${id}`);
  }

  static getAll() {
    return Api.get(Api.room.url);
  }

  static getRoomDevices(id){
    return Api.get(`${Api.room.url}/${id}/devices`);
  }

  static addDevice(roomId, deviceId){
    return Api.post(`${Api.room.url}/${roomId}/devices/${deviceId}`);
  }

  static removeDevice(deviceId){
    return Api.delete(`${Api.room.url}/devices/${deviceId}`);
  }
}

Api.device = class {
  static get url() {
    return `${Api.baseUrl}/devices`;
  }

  static add(device) {
    return Api.post(Api.device.url, device);
  }

  static modify(device) {
    return Api.put(`${Api.device.url}/${device.id}`, device);
  }

  static delete(id) {
    return Api.delete(`${Api.device.url}/${id}`);
  }

  static get(id) {
    return Api.get(`${Api.device.url}/${id}`);
  }

  static getAll() {
    return Api.get(Api.device.url);
  }

  static getByType(typeId){
    return Api.get(`${Api.device.url}/devicetypes/${typeId}`);
  }

  static getAllLogs(limit, offset){
    return Api.get(`${Api.device.url}/logs/limit/${limit}/offset/${offset}`);
  }

  static getState(id) {
    return Api.get(`${Api.device.url}/${id}/state`);
  }

  static getLogs(id, limit, offset){
    return Api.get(`${Api.device.url}/${id}/logs/limit/${limit}/offset/${offset}`);
  }

  static excecuteAction(id, actionName, params){
    return Api.put(`${Api.device.url}/${id}/${actionName}`, params);
  }

  static getAllEventSource(){
    return new EventSource(`${Api.device.url}/events`);
  }

  static getEventSource(id){
    return new EventSource(`${Api.device.url}/${id}/events`);
  }
}

Api.home = class {
  static get url() {
    return `${Api.baseUrl}/homes`;
  }

  static add(home) {
    return Api.post(Api.home.url, home);
  }

  static modify(home) {
    return Api.put(`${Api.home.url}/${home.id}`, home);
  }

  static delete(id) {
    return Api.delete(`${Api.home.url}/${id}`);
  }

  static get(id) {
    return Api.get(`${Api.home.url}/${id}`);
  }

  static getAll() {
    return Api.get(Api.home.url);
  }

  static addRoom(homeId, roomId){
    return Api.post(`${Api.home.url}/${homeId}/rooms/${roomId}`);
  }

  static getHomeRooms(id){
    return Api.get(`${Api.home.url}/${id}/rooms`);
  }

  static removeRoom(roomId){
    return Api.delete(`${Api.home.url}/rooms/${roomId}`);
  }
}

Api.routine = class {
  static get url() {
    return `${Api.baseUrl}/routines`;
  }

  static add(routine) {
    return Api.post(Api.routine.url, routine);
  }

  static modify(routine) {
    return Api.put(`${Api.routine.url}/${routine.id}`, routine);
  }

  static delete(id) {
    return Api.delete(`${Api.routine.url}/${id}`);
  }

  static get(id) {
    return Api.get(`${Api.routine.url}/${id}`);
  }

  static getAll() {
    return Api.get(Api.routine.url);
  }

  static execute(id){
    return Api.put(`${Api.routine.url}/${id}/execute`);
  }
}

export default Api;
