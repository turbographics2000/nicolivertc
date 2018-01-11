import { EventEmitter } from "../lib/EventEmitter.js";

export class DeviceWatcher extends EventEmitter {
    constructor(kind) {
        super({});
        this.deviceIds = null;
        this.devices = null;
        navigator.mediaDevices.ondevicechange = this.onDeviceChange.bind(this);
        this.onDeviceChange();
    }

    onDeviceChange(evt) {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            devices = devices.filter(device => !['default', 'communications'].includes(device.deviceId));
            if(this.devices) {
                this.update(devices);
            } else {
                this.deviceIds = devices.map(device => device.deviceId).filter((deviceId, index, array) => array.indexOf(deviceId) === index);
                this.devices = devices;
            }
        });
    }

    update(devices) {
        const deviceIds = devices.map(device => device.deviceId).filter((deviceId, index, arr) => arr.indexOf(deviceId) === index);

        const connectDeviceIds = deviceIds.filter(deviceId => !this.deviceIds.includes(deviceId));
        const connectDevices = devices.filter(device => connectDeviceIds.includes(device.deviceId));
        const connectCameraDevices = connectDevices.filter(device => device.kind === 'videoinput');
        const connectMicDevices = connectDevices.filter(device => device.kind === 'audioinput');
        if (connectCameraDevices.length) {
            this.emit('connectCamera', connectCameraDevices);
        }
        if (connectMicDevices.length) {
            this.emit('connectMic', connectMicDevices);
        }

        const disconnectDeviceIds = this.deviceIds.filter(deviceId => !deviceIds.includes(deviceId));
        const disconnectDevices = this.devices.filter(device => disconnectDeviceIds.includes(device.deviceId));
        const disconnectCameraDevices = disconnectDevices.filter(device => device.kind === 'videoinput');
        const disconnectMicDevices = disconnectDevices.filter(device => device.kind === 'audioinput');
        if (disconnectCameraDevices.length) {
            this.emit('disconnectCamera', disconnectCameraDevices);
        }
        if (disconnectMicDevices.length) {
            this.emit('disconnectMic', disconnectMicDevices);
        }

        this.deviceIds = deviceIds;
        this.devices = devices;
    }
}