import util from '../base/util.js';
import WebOBSData from '../base/WebOBSData.js';
import DeviceWatcher from '../base/DeviceWatcher.js';
import Animator from '../base/Animator.js';
import { ListController } from './ListController.js';
import { StreamController } from '../base/StreamController.js';

export class MicListController extends ListController {
    constructor(selector) {
        super(selector, 'mic');
        DeviceWatcher.on('connecedtMic', this.onConnectedMic.bind(this));
        DeviceWatcher.on('disconnecedtMic', this.onDisconnectedMic.bind(this));
        WebOBSData.on('micAdded', this.onMicAdded.bind(this));
        util.draggingTarget = null;
        setTimeout(async _ => {
            this.getStream();
        }, 0);
    }

    onMicAdded(item) {
        this.createItemElement(item);
    }

    async onConnectedMic(devices) {
        this.getStream(devices);
    }

    onDisconnectedMic(devices) {
        devices.forEach(device => {
            this.items.some((item, index) => {
                if(item.deviceId === device.deviceId) {
                    WebOBSData.remove(this.type, index);
                    return true;
                }
            });
        });
    }

    onClick() { }

    async getStream(devices) {
        devices = devices || await util.getDevices('audioinput');
        await devices.forEach(async device => {
            if (this.items.some(item => item.deviceId === device.deviceId)) return;
            await util.getStream(this.type, 'audio', device.label, device.deviceId, WebOBSData);
        });
    }

    createItemElement(item) {
        const itemHeader = util.newElm({
            textContent: item.name,
            classes: ['item-header', 'ellipsis'],
            title: `DeviceId:${item.deviceId}\nName:\t${item.name}`
        });

        item.audioMeter = util.newElm({
            classes: ['item-audio-meter']
        });

        const audioMeterContainer = util.newElm({
            classes: ['item-audio-meter-container', 'item-target'],
            children: [item.audioMeter]
        });

        const controllerContainer = util.newElm({
            classes: ['item-player-controller-container']
        });
        item.controller = new StreamController(item, controllerContainer);

        item.elm = util.newElm({
            draggable: true,
            classes: ['item', 'grid', 'theme-color-l1'],
            children: [itemHeader, audioMeterContainer, controllerContainer],
            ondragstart: this.onDragStart.bind(this),
            ondragend: this.onDragEnd.bind(this)
        });

        Animator.add(item);

        this.container.appendChild(item.elm);
    }
}