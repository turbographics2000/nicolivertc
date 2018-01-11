import { EventEmitter } from './EventEmitter.js';

export class ItemManager extends EventEmitter {
    constructor(options) {
        super(options);

        this.list = [];
        this.dictionary = {};
        this.keyName = options.keyName || 'name';
    }

    get length() {
        return this.list.length;
    }

    get lastIndex() {
        return this.list.length - 1;
    }

    getItem(indexOrKey) {
        if (isNaN(indexOrKey)) {
            return this.dictionary[indexOrKey] || null;
        } else {
            return this.list[+indexOrKey] || null;
        }
    }

    clear() {
        this.list = [];
        this.dictionary = {};
    }

    add(item) {
        this.list.push(item);
        this.dictionary[item.name] = item;
        this.emit('itemAdded', { index: this.lastIndex, item });
    }

    remove(index) {
        const item = this.list.splice(index, 1)[0];
        delete this.dictionary[item.name];
        this.emit('itemRemoved', { index, item });
    }

    rename(name) {

    }

    up(index) {
        if (index === 0) return;
        const tmp = this.list.splice(index, 1)[0];
        this.list.splice(index - 1, 0, tmp);

        this.emit('itemMoved', {
            oldIndex: index,
            newIndex: index - 1,
            item: tmp
        });
    }

    down(index) {
        if (index === this.list.length - 1) return;
        const tmp = this.list.splice(index, 1)[0];
        this.list.splice(index + 1, 0, tmp);

        this.emit('itemMoved', {
            oldIndex: index,
            newIndex: index + 1,
            item: tmp
        });
    }

    setting(index) {

    }

}