import { AudioInputItem } from "./AudioInputItem.js";
import { DialogController } from "../base/DialogController.js";
import util from '../base/util.js';

export class MicAudioInputItem extends AudioInputItem {
    constructor(options) {
        super(options);

        this._deviceId = options.deviceId || 'default';
        this._name = options.name;
        this.dialog = new DialogController({
            description: 'マイク選択',
            description: true,
            input: true,
            select: false,
            btnCancel: true
        });
    }

    get name() {
        return `${this._name}`;
    }

    get deviceId() {
        return this._deviceId;
    }
    set deviceId(value) {
        if (this._deviceId !== value) {
            const device = this.getDevice(value);
            if (!device) {
                throw 'invalid deviceId.';
            }
            this._name = device.label;
            this.getStream();
        }
        this._deviceId = value;
    }

    async getConstraints() {
        return {
            audio: { deviceId: this.deviceId },
            video: false
        }
    }

    enumDevices() {
        return navigator.mediaDevices.enumerateDevices();
    }

    getDevice(devId) {
        return this.enumDevices().then(devices => {
            devices = devices.filter(device => device.deviceId === devId);
            return devices.length === 1 ? devices[0] : null;
        });
    }

    setting() {
        if (this.dialog) {
            this.dialog.show({ descriptionText: 'マイク選択' });
        }
    }
}