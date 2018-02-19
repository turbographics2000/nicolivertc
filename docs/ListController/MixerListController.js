import util from '../base/util.js';
import WebOBSData from '../base/WebOBSData.js';
import DeviceWatcher from '../base/DeviceWatcher.js';
import Animator from '../base/Animator.js';
import { ListController } from './ListController.js';
import { AudioInputItemManager } from '../mixer/AudioInputItemManager.js';
import { StreamController } from '../base/StreamController.js';

export class MixerListController extends ListController {
    constructor(selector) {
        super(selector, 'mixer');
        DeviceWatcher.on('connectMic', this.onConnectMic.bind(this));
        DeviceWatcher.on('disconnectMic', this.onDisconnectMic.bind(this));
        WebOBSData.on('mixerAdded', this.onMixerAdded.bind(this));
        setTimeout(_ => {
            this.getStream();
        }, 0);
    }

    onMixerAdded(item) {
        this.createItemElement(item);
    }

    onConnectMic(devices) {
        const deviceIds = this.list.map(item => item.deviceId);
        const filteredDevices = devices.filter(device => !deviceIds.includes(devices.deviceId));
        this.getStream(filteredDevices);
    }

    onDisconnectMic(devices) {
        devices.forEach(device => {
            const index = this.list.findIndex(item => item.deviceId === device.deviceId);
            if (index !== -1) {
                this.removeItem(index);
            }
        });
    }

    onInput_volume(evt, item, propertyName) {
        item[propertyName] = evt.target.value;
        this.updateText(item.controls.texts[propertyName], evt.target.value);
    }

    onClick_settings(evt, index) {
        // TODO
    }

    onItemStateChanged(item, index, state, error) {
        const name = item.controls.texts.name;
        const volume = item.controls.inputs.volume;
        //const settings = item.controls.buttons.settings;
        const muted = item.controls.toggleButtons.muted;
        const err = item.controls.error.errorMessage;
        switch (state) {
            case 'started':
                name.classList.remove('error');
                err.classList.remove('error');
                //settings.classList.remove('disabled');
                muted.classList.remove('disabled');
                name.textContent = item.name;
                volume.disabled = false;
                break;
            case 'stopped':
                volume.disabled = true;
                break;
            case 'error':
                name.classList.add('error');
                err.classList.add('error');
                //settings.classList.add('disabled');
                muted.classList.add('disabled');
                volume.disabled = true;
                break;
        }
    }

    async getStream() {
        const devices = await util.getDevices('audioinput');
        if(!devices.length) return;
        await util.getStream(this.type, 'audio', devices[0].label, devices[0].deviceId, WebOBSData);
    }

    updateInput(ctrl, value) {
        ctrl.value = value;
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
        item.id = 'mixer_' + item.id;
        item.controller = new StreamController(item, controllerContainer);

        item.elm = util.newElm({
            draggable: true,
            classes: ['item', 'grid'],
            children: [itemHeader, audioMeterContainer, controllerContainer],
            ondragstart: this.onDragStart.bind(this),
            ondragend: this.onDragEnd.bind(this)
        });

        Animator.add(item);

        this.container.appendChild(item.elm);
    }

    updateToggleButton(ctrl, value) {
        if (ctrl.dataset.propertyName === 'muted') {
            value = !value;
        }
        if (value) {
            if (!ctrl.classList.contains('on')) {
                ctrl.classList.add('on');
            }
        } else {
            ctrl.classList.remove('on');
        }
    }
}