import Api from "./Api.js";
import Device from "./Device";
import Room from "./Room";
import Home from "./Home";
import Routine from "./Routine";


export function createDevice(name, typeId, room) {
    let device = new Device(null, `${room.home.id}_${room.id}_${name}`, { id: typeId }, {fav: false});
    return new Promise( (resolve, reject) => {
    Api.device.add(device)
        .then( data => {
            device.id = data.result.id;
            device.type = data.result.type;
            device.state = data.result.state;

            room.addDevice(device.id)
                .then( () => {
                    device.room = room;
                    resolve(device);
                })
                .catch(reject);
        })
        .catch(reject);
    });
}

export function createRoom(name, home){
    let room = new Room(null, `${home.id}_${name}`, {});
    return new Promise( (resolve, reject) => {
        Api.room.add(room)
            .then( data => {
                room.id = data.result.id;
                home.addRoom(room.id)
                    .then( () => {
                        room.home = home;
                        resolve(room);
                    })
                    .catch(reject);
            })
            .catch(reject);
    });
}

export function createHome(name){
    let home = new Home(null, name, {});
    return new Promise( (resolve, reject) => {
        Api.home.add(home)
            .then( data => {
                home.id = data.result.id;
                resolve(home);
            })
            .catch(reject);
    });
}

export function createRoutine(name, actions, description = ""){
    let routine = new Routine(null, name, {fav: false, desc: description}, actions);
    return new Promise( (resolve, reject) =>
        Api.routine.add(routine)
            .then( data => {
                routine.id = data.result.id;
                resolve(routine);
            })
            .catch(reject))
}

export function createDeviceFromScratch(homeName, roomName, deviceName, typeId){
    return new Promise( (resolve, reject) => {
        createHome(homeName)
            .then(home => {
                createRoom(roomName, home)
                    .then( room => {
                        createDevice(deviceName, typeId, room)
                            .then( device => resolve(device) )
                            .catch(reject);
                    })
                    .catch(reject);
            })
            .catch(reject);
    });
}

export function createDeviceFromNotExistingRoom(home, roomName, deviceName, typeId){
    return new Promise( (resolve, reject) => {
        createRoom(roomName, home)
            .then( room => {
                createDevice(deviceName, typeId, room)
                    .then( device => resolve(device) )
                    .catch(reject);
            })
            .catch(reject);
    });
}

export function updateDeviceToNewHome(homeName, newRoom, device){
    return new Promise((resolve, reject) => {
        Room.removeDevice(device.id, device.room.id, device.room.home.id)
            .then(() => {
                createHome(homeName)
                    .then(home => {
                        createRoom(newRoom, home)
                            .then(room => persistUpdatesOnDevice(room, device, resolve, reject))
                            .catch(reject);
                    })
                    .catch(reject);
            })
            .catch(reject);
    });
}

export function updateDeviceToNewRoom(home, newRoom, device){
    return new Promise((resolve, reject) => {

        // Nueva casa, hay que hacer cascade
        if(home.id !== device.room.home.id)
            Room.removeDevice(device.id, device.room.id, device.room.home.id)
                .then(() => {
                    createRoom(newRoom, home)
                        .then(room => persistUpdatesOnDevice(room, device, resolve, reject))
                        .catch(reject);
                })
                .catch(reject);

        // Misma casa, no hay que hacer cascade
        else {
            let oldRoomId = device.room.id;
            let homeId = home.id;
            Api.room.removeDevice(device.id)
                .then(() => {
                    createRoom(newRoom, home)
                        .then(room => {
                            persistUpdatesOnDevice(room, device, resolve, reject);
                            Room.emptyCheck(oldRoomId, homeId);
                        })
                        .catch(reject);
                })
                .catch(reject);
        }
    });
}

export function updateDeviceToExistingRoom(room, device){
    return new Promise((resolve, reject) => {
        Room.removeDevice(device.id, device.room.id, device.room.home.id)
            .then(() => persistUpdatesOnDevice(room, device, resolve, reject))
            .catch(reject);
    });
}

function persistUpdatesOnDevice(room, device, resolve, reject){
    room.addDevice(device.id)
        .then( () => {
            device.room = room;
            device.setNewName(device.getName());
            device.persistChanges();
            resolve(device);
        })
        .catch(reject);
}

export function getActionParams(actions, action){
    return actions.find(elem => elem.name === action).params;
}

export function getFavs() {
    return new Promise( (resolve, reject) => {
        Api.device.getAll()
            .then( data => resolve(
                data.result
                    .filter( elem => elem.meta.fav )
                    .map( elem => new Device(elem.id, elem.name, elem.type, elem.meta, elem.state, elem.room))
            ))
            .catch(reject);
    });
}

export function setStatePolling(stateChangeHandler, timeout = 5000){
    return setInterval(() => {
        this.props.getState()
            .then( data => {
                this.props.state = data.result;
                stateChangeHandler(data.result);
            })
            .catch(console.log);
    }, timeout);
}

export function loadAllSupportedValues(deviceID, actions) {
    Api.deviceType.get(deviceID)
        .then(data => {
            let actionsArray = data.result.actions;
            actions.forEach( entry => entry.handler(getActionParams(actionsArray, entry.action)))
        })
        .catch(console.log);
}
const supportedDeviceTypes = [
    'ac','oven','speaker','lamp',
    'faucet', 'vacuum','blinds', 'door',
]

const iconInfo = {
    ac : {
        bgColor: '#FFF3C8',
        color: '#FDC701',
        src: 'mdi-fan'
    },
    blinds: {
        bgColor: '#f2d6ff',
        color: '#BF38FF',
        src:'mdi-window-shutter'
    },
    speaker: {
        bgColor: '#E1E0FE',
        color: '#6563FF',
        src:'mdi-speaker'
    },
    oven: {
        bgColor: '#FFBBBB',
        color: '#C01616',
        src:'mdi-stove'
    },
    faucet: {
        bgColor: '#B5FFB4',
        color: '#08B106',
        src:'mdi-sprinkler-variant'
    },
    lamp: {
        bgColor: '#FFFBDB',
        color: '#E9D94D',
        src:'mdi-lamp'
    },
    vacuum: {
        bgColor: "#BEF3FF",
        color: "#0091B1",
        src:'mdi-robot-vacuum-variant'
    },
    door: {
        bgColor: "#C8A776",
        color: "#6D4201",
        src: "mdi-door"
    }

}

export function getIconInfo(deviceName) {
    return iconInfo[deviceName];
}

export function getSupportedDeviceTypes() {
    return new Promise((resolve, reject) => {
        Api.deviceType.getAll().then(data => resolve(data.result
            .filter(entry => supportedDeviceTypes.includes(entry.name))
            .map(entry => {return{id: entry.id, name: entry.name, iconInfo: getIconInfo(entry.name)}})
        )).catch(reject)
    });
}

export function getDeviceTypesInHome(homeID) {
     return new Promise( (resolve, reject) => {
         Api.device.getAll().then(
             data => {
                 let ans = data.result
                     .filter(entry => entry.room.home.id === homeID)
                     .map(entry => entry.type.name);
                 ans = ans.filter((entry, index) => ans.indexOf(entry) === index);
                 ans = ans.map(typeName => {
                     return {deviceTypeName: typeName, iconInfo: getIconInfo(typeName)}
                 });
                 resolve(ans);
             }).catch(reject);
     });
}

export function getDeviceTypesInRoom(roomID) {
    return new Promise( (resolve, reject) => {
        Api.room.getRoomDevices(roomID).then(
            data => {
                let ans = data.result
                    .map(entry => entry.type.name);
                ans = ans.filter((entry, index) => ans.indexOf(entry) === index);
                ans = ans.map(entry => { return {deviceTypeName: entry, iconInfo: getIconInfo(entry)}});
                resolve(ans);
            }).catch(reject);
    });
}

export function getRoomsAndDeviceTypesMapFromHome(homeID) {
    return new Promise( (resolve, reject) => {
        Api.home.getHomeRooms(homeID).then(data => {
            let ans = [];
            data.result.forEach(room => getDeviceTypesInRoom(room.id).then(data => {
                let aux = {};
                aux['deviceTypeArray'] = data;
                aux['roomName'] = room.name;
                aux['id'] = room.id;
                ans.push(aux);
            }).catch(console.log));
            resolve(ans);
        }).catch(reject);
    });
}

export function deleteRoom(roomId, homeId, upCascade = false){
    return new Promise( (resolve, reject) => {
        Api.room.getRoomDevices(roomId)
            .then(data => {
                data.result.forEach(device => {
                    Api.room.removeDevice(device.id).catch(reject);
                    Api.device.delete(device.id).catch(reject);
                });
                if(upCascade)
                    Room.deleteRoom(roomId, homeId)
                        .then(resolve)
                        .catch(reject);
                else
                    Api.room.delete(roomId)
                        .then(response => resolve(response.result))
                        .catch(reject);
            })
            .catch(reject);
    });
}

export function deleteHome(homeId){
    return new Promise( (resolve, reject) => {
        Api.home.getHomeRooms(homeId)
            .then(data => {
                data.result.forEach(room => {
                    Api.home.removeRoom(room.id).catch(reject);
                    deleteRoom(room.id).then().catch(reject);
                });
                Api.home.delete(homeId)
                    .then(response => resolve(response.result))
                    .catch(reject);
            })
            .catch(reject);
    });
}

// https://css-tricks.com/converting-color-spaces-in-javascript/
export function HSLtoHex(hue, satur, lumin) {
    satur /= 100;
    lumin /= 100;

    let c = (1 - Math.abs(2 * lumin - 1)) * satur,
        x = c * (1 - Math.abs((hue / 60) % 2 - 1)),
        m = lumin - c/2,
        r = 0,
        g = 0,
        b = 0;

    if (0 <= hue && hue < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= hue && hue < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= hue && hue < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= hue && hue < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= hue && hue < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= hue && hue < 360) {
        r = c; g = 0; b = x;
    }
    // Having obtained RGB, convert channels to hex
    r = Math.round((r + m) * 255).toString(16);
    g = Math.round((g + m) * 255).toString(16);
    b = Math.round((b + m) * 255).toString(16);

    // Prepend 0s, if necessary
    if (r.length === 1)
        r = "0" + r;
    if (g.length === 1)
        g = "0" + g;
    if (b.length === 1)
        b = "0" + b;

    return r + g + b;
}

export function hexToHSL(H) {
    // Convert hex to RGB first
    let r = "0x" + H[0] + H[1];
    let g = "0x" + H[2] + H[3];
    let b = "0x" + H[4] + H[5];

    // Then to HSL
    r /= 255;
    g /= 255;
    b /= 255;
    let cmin = Math.min(r,g,b),
        cmax = Math.max(r,g,b),
        delta = cmax - cmin,
        h, s, l;

    if (delta === 0)
        h = 0;
    else if (cmax === r)
        h = ((g - b) / delta) % 6;
    else if (cmax === g)
        h = (b - r) / delta + 2;
    else
        h = (r - g) / delta + 4;

    h = Math.round(h * 60);

    if (h < 0)
        h += 360;

    l = (cmax + cmin) / 2;
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return { hue: h, saturation: s, luminosity: l};
}

export function getRoomDevices(roomID){
    return new Promise( (resolve, reject) => {
        Api.device.getAll().then(data => resolve(data.result
        .filter(elem => elem.room.id === roomID)
        .map( elem => new Device(elem.id, elem.name, elem.type, elem.meta, elem.state, elem.room)))
    ).catch(reject);
    });
}

export function getDevicesByHomeAndType(homeID, typeName){

    return new Promise( (resolve, reject) => {
        Api.device.getAll().then(data => resolve(data.result
            .filter(elem => elem.room.home.id === homeID && elem.type.name === typeName)
            .map( elem => new Device(elem.id, elem.name, elem.type, elem.meta, elem.state, elem.room)))
        ).catch(reject);
    });
}

export function getHomeItemsArray(){
    return new Promise((resolve, reject) => {
        Api.home.getAll()
            .then(data => resolve(data.result.map(home => { return {text: home.name , value: { id: home.id, name: home.name }} })))
            .catch(reject);
    })
}

export function getRoomItemsArray(homeID){
    return new Promise((resolve, reject) => {
        Api.home.getHomeRooms(homeID)
            .then(data => resolve(data.result.map(room => {return {text: room.name.split("_").pop() , value: { id: room.id, name: room.name.split("_").pop() }} })))
            .catch(reject);
    })
}

export function getDeviceItemsArray(roomID) {
    return new Promise((resolve, reject) => {
        Api.room.getRoomDevices(roomID)
            .then(data => resolve(data.result.map(device => {return {text: device.name.split("_").pop() , value: device }})))
            .catch(reject);
    })
}

export function getActionsItemsArray(deviceTypeID) {
    return new Promise((resolve, reject) => {
        Api.deviceType.get(deviceTypeID)
            .then(data => resolve(data.result.actions.map(action => {return {text: action.name , value: action }})))
            .catch(reject);
    })
}

export function searchDevicesByName(name){
    name = name.trim().toLowerCase();
    return new Promise( (resolve, reject) => {
        Api.device.getAll().then(data => resolve(data.result
            .filter(elem => elem.name.split("_").pop().toLowerCase().includes(name))
            .map( elem => new Device(elem.id, elem.name, elem.type, elem.meta, elem.state, elem.room)))
        ).catch(reject);
    });
}