import util from '../base/util.js';
import WebOBSData from '../base/WebOBSData.js';
import DeviceWatcher from '../base/DeviceWatcher.js';
import { ListController } from './ListController.js';

export class CameraListController extends ListController {
    constructor(selector) {
        super(selector, 'camera');

        DeviceWatcher.on('connectedCamera', this.onConnectedCamera.bind(this));
        DeviceWatcher.on('disconnectedCamera', this.onDisconnectCamera.bind(this));
        WebOBSData.on('cameraAdded', this.onCameraAdded.bind(this));

        this.draggingTarget = null;
        setTimeout(_ => {
            this.getStream();
        }, 0);
    }

    onConnectedCamera(devices) {
        this.getStream(devices);
    }

    onDisconnectCamera(devices) {
        devices.forEach(device => {
            this.items.some((item, index) => {
                if(item.deviceId === device.deviceId) {
                    WebOBSData.remove(this.type, index);
                    return true;
                }
            });
        });
    }

    onCameraAdded(item) {
        this.createItemElement(item);
    }

    async getStream(devices) {
        devices = devices || await util.getDevices('videoinput');
        await devices.forEach(async device => {
            if (this.items.some(item => item.deviceId === device.deviceId)) return;
            await util.getStream(this.type, 'video', device.label, device.deviceId, WebOBSData);
        });
    }

    createItemElement(item) {
        const itemHeader = util.newElm({
            textContent: item.name,
            classes: ['item-header', 'ellipsis'],
            title: `DeviceId:${item.deviceId}\nName:\t${item.name}`
        });

        item.target.classList.add('item-target');

        item.elm = util.newElm({
            draggable: true,
            classes: ['item', 'grid', 'theme-color-l1'],
            children: [item.target, itemHeader],
            ondragstart: this.onDragStart.bind(this),
            ondragend: this.onDragEnd.bind(this)
        });

        this.container.appendChild(item.elm);
    }
}