import { ListController } from '../base/ListController.js';
import { ItemManager } from '../base/ItemManager.js';
import { DeviceWatcher } from '../base/DeviceWatcher.js';
import util from '../base/util.js';

export class CameraListController extends ListController {
    constructor(selector, options) {
        super(selector, Object.assign({}, options, {
            items: new ItemManager(options || {})
        }));

        util.deviceWatcher.on('connectCamera', this.onConnectCamera.bind(this));
        util.deviceWatcher.on('disconnectCamera', this.onDisconnectCamera.bind(this));
        this.draggingTarget = null;
        setTimeout(_ => {
            this.getItems();
        }, 0);
    }

    onConnectCamera(devices) {
        if (this.getItems) this.getItems(devices);
    }

    onDisconnectCamera(devices) {
        devices.forEach(device => {
            const index = this.list.findIndex(item => item.deviceId === device.deviceId);
            if (index !== -1) {
                this.removeItem(index);
            }
        });
    }

    getItemElements() {
        return [...this.container.querySelectorAll(':scope > div')];
    }

    async getItems(devices) {
        if (!devices) {
            devices = await navigator.mediaDevices.enumerateDevices();
            devices = devices.filter(device => !['default', 'communications'].includes(device.deviceId));
            devices = devices.filter(device => device.kind === 'videoinput');
        }
        await devices.forEach(async device => {
            const stream = await this.getStream(device);
            const video = await (_ => {
                return new Promise((resolve, reject) => {
                    const video = document.createElement('video');
                    video.autoplay = true;
                    video.onloadedmetadata = evt => {
                        resolve(video);
                    }
                    video.onerror = evt => {
                        reject(evt);
                    };
                    video.srcObject = stream;
                });
            })();
            const item = {
                name: device.label,
                deviceId: device.deviceId,
                connecting: true,
                target: video,
                type: 'camera',
                mediaType: 'camera',
                visibility: true,
                locked: true,
                width: video.videoWidth,
                height: video.videoHeight,
                aspectRatio: video.videoWidth ? video.videoWidth / video.videoHeight : 0
            };
            this.addItem(item);
        });

    }

    async getStream(device) {
        const stream = navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { deviceId: device.deviceId }
        });
        return stream;
    }

    createItemElement(item, container, index) {
        const itemHeader = util.newElm({
            textContent: item.name,
            classes: ['item-header', 'ellipsis', 'drag-target-name']
        });
        const itemElm = util.newElm({
            attributes: { draggable: true },
            classes: ['item'],
            children: [item.target, itemHeader]
        });
        itemElm.ondragstart = this.onDragStart.bind(this);
        itemElm.ondragend = this.onDragEnd.bind(this);
        this.container.appendChild(itemElm);
    }
}