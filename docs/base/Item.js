import { EventEmitter } from './EventEmitter.js';
import util from './util.js';

export class Item extends EventEmitter {
    constructor(item) {
        super({});
        this.id = util.generateUUID();
        Object.assign(this, item || {});
    }

    dispose() {
        this.emit('dispose', this.id);
    }
}