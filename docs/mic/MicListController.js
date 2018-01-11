import { ListController } from '../base/ListController.js';
import { ItemManager } from '../base/ItemManager.js';
import { DeviceWatcher } from '../base/DeviceWatcher.js';
import util from '../base/util.js';

export class MicListController extends ListController {
    constructor(selector, options) {
        super(selector, Object.assign({}, options, {
            items: new ItemManager(options || {})
        }));

        util.deviceWatcher.on('connectMic', this.onConnectMic.bind(this));
        util.deviceWatcher.on('disconnectMic', this.onDisconnectMic.bind(this));
        util.draggingTarget = null;
        setTimeout(_ => {
            this.getItems().then(_ => this.updateVolumeMeter());
        }, 0);
    }

    getItemElements() {
        return [...this.container.querySelectorAll(':scope > div')];
    }

    async getItems(devices) {
        if (!devices) {
            devices = await navigator.mediaDevices.enumerateDevices();
            devices = devices.filter(device => !['default', 'communications'].includes(device.deviceId));
        }
        const micDevices = devices.filter(device => device.kind === 'audioinput');
        await micDevices.forEach(async device => {
            const stream = await this.getStream(device);
            const analyser = util.audioContext.createAnalyser();
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            const source = util.audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            const item = {
                name: device.label,
                deviceId: device.deviceId,
                target: null,
                analyser,
                bufferLength,
                dataArray,
                source,
                type: 'mic',
                mediaType: 'mic',
                visibility: true,
                locked: true,
                width: 0,
                height: 0,
                aspectRatio: 0
            };
            this.addItem(item);
        });
    }

    getStream(device) {
        return navigator.mediaDevices.getUserMedia({
            audio: { deviceId: device.deviceId },
            video: false
        });
    }

    createItemElement(item, container, index) {
        const itemHeader = util.newElm({
            textContent: item.name,
            classes: ['item-header', 'ellipsis']
        });
        const volumeMeter = util.newElm({
            classes: ['item-volumemeter']
        });
        const volumeMeterContainer = util.newElm({
            classes: ['item-volumemeter-container'],
            children: [volumeMeter]
        });
        const itemElm = util.newElm({
            attributes: { draggable: true },
            classes: ['item'],
            children: [itemHeader, volumeMeterContainer]
        });
        item.volumeMeter = volumeMeter;
        itemElm.ondragstart = this.onDragStart.bind(this);
        itemElm.ondragend = this.onDragEnd.bind(this);
        this.container.appendChild(itemElm);
    }

    onDragStart(evt) {
        // Firefoxではデータがセットされてないとダメ
        evt.dataTransfer.setData('text/plain', 'dummy');
        const video = evt.target.querySelector('.source-video');
        this.draggingTarget = this.selectedItem;
        console.log(this.draggingTarget);
    }

    onDragEnd(evt) {
        this.draggingTarget = null;
    }

    onConnectMic(devices) {
        const deviceIds = this.list.map(item => item.deviceId);
        const filteredDevices = devices.filter(device => !deviceIds.includes(devices.deviceId));
        this.getItems(filteredDevices);
    }

    onDisconnectMic(devices) {
        devices.forEach(device => {
            const index = this.list.findIndex(item => item.deviceId === device.deviceId);
            if (index !== -1) {
                this.removeItem(index);
            }
        });
    }

    updateVolumeMeter() {
        const list = this.items.list;
        this.volumeMeterRenderId = requestAnimationFrame(this.updateVolumeMeter.bind(this));
        const itemCnt = list.length;
        for (let i = 0; i < itemCnt; i++) {
            const item = list[i];
            if (!item.volumeMeter) continue;
            item.analyser.getByteFrequencyData(item.dataArray);
            let max = 0;
            for (let j = 0; j < item.bufferLength; j++) {
                if (max < item.dataArray[j]) max = item.dataArray[j];
            }
            if (item.volumeCap < max) {
                item.volumeCap = max;
            } else {
                item.volumeCap--;
            }
            item.volumeMeter.style.width = `${max / 256 * 100 | 0}%`;
        }
    }
}