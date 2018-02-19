import util from './util.js';
import Animator from './Animator.js';
import { EventEmitter } from './EventEmitter.js';

class WebOBSData extends EventEmitter {
    constructor() {
        super();
        this.data = {
            transition: 'cut',
            transitionTime: 0
        };
        [
            'camera',
            'mic',
            'desktop',
            'audio',
            'video',
            'image',
            'text',
            'mixer'
        ].forEach(type => {
            this.data[type] = {
                selectedId: null,
                selectedIndex: -1,
                items: []
            };
        });
        this.data.scene = {
            selectedIndex: -1,
            items: []
        };
        this.mediaTypes = ['camera', 'mic', 'audio', 'video', 'image', 'text'];
        this._useWebGL = false;
    }

    get useWebGL() {
        return this._useWebGL;
    }
    set useWebGL(value) {
        this._useWebGL = value;
    }

    get transition() {
        return this.data.transition;
    }

    set transition(value) {
        this.data.transition = value;
    }

    get transitionTime() {
        return this.data.transitionTime;
    }

    set transitionTime(value) {
        this.data.transitionTime = value;
    }

    _fixedType(type) {
        return type === 'sceneAudio' ? 'source' : type;
    }
    _getData(type) {
        type = this._fixedType(type);
        return type === 'source' ? this.getSelectedItem('scene') : this.data[type];
    }

    dispatchEvent(eventName) {
        this.emit(eventName);
    }

    getItems(type) {
        type = this._fixedType(type);
        return this._getData(type).items;
    }

    getSelectedIndex(type) {
        type = this._fixedType(type);
        return this._getData(type).selectedIndex;
    }

    getSelectedItem(type) {
        type = this._fixedType(type);
        const data = this._getData(type);
        if (data.selectedIndex === -1) return null;
        return data.items[data.selectedIndex];
    }

    setSelectedIndex(type, newIndex) {
        type = this._fixedType(type);
        const data = this._getData(type);
        if (data.selectedIndex === newIndex || (newIndex !== -1 && !data.items[newIndex])) return;
        const oldIndex = data.selectedIndex;
        data.selectedIndex = newIndex;
        data.items.forEach(item => {
            if (Array.isArray(item.elm)) {
                item.elm.forEach(elm => {
                    elm.classList.remove('selected');
                });
            } else {
                item.elm.classList.remove('selected');
            }
        });
        if (newIndex !== -1) {
            if (Array.isArray(data.items[newIndex].elm)) {
                data.items[newIndex].elm.forEach(elm => {
                    elm.classList.add('selected');
                    elm.scrollIntoView();
                });
            } else {
                data.items[newIndex].elm.classList.add('selected');
                data.items[newIndex].elm.scrollIntoView();
            }
        }
        this.emit(`selected ${type} changed`, {
            oldIndex,
            newIndex,
            oldItem: data.items[oldIndex],
            newItem: newIndex === -1 ? null : data.items[newIndex]
        });
    }

    setSelectedItem(type, item) {
        type = this._fixedType(type);
        const index = this.getItems(type).indexOf(item);
        if (index === -1) return;
        if (this.getSelectedIndex(type) === index) return;
        this.setSelectedIndex(type, index);
    }

    add(type, arg, addSource) {
        type = this._fixedType(type);
        if (type === 'scene') {
            this.addScene(arg);
        } else if (type === 'source') {
            this.addSource(arg);
        } else {
            this.addMedia(arg);
            if (addSource) {
                this.addSource(arg);
            }
        }
    }

    async addMedia(item) {
        if (this.getItems(item.mediaType).some(itm => itm.id === item.id)) return;
        this.getItems(item.mediaType).push(item);
        this.emit(`${item.mediaType}Added`, item);
    }

    addScene(item) {
        item = Object.assign({
            id: util.generateUUID(),
            items: [],
            special: false
        }, item);
        this.getItems('scene').push(item);
        this.emit('sceneAdded', item);
        this.setSelectedIndex('scene', this.getItems('scene').length - 1);
    }

    addSource(mediaItem) {
        const item = Object.assign({}, mediaItem);
        item.id = util.generateUUID();
        let list = [];
        this.data.scene.items.forEach(sceneItem => {
            sceneItem.items.forEach(sourceItem => list.push(sourceItem));
        });
        item.sourceItemName = util.generateUnusedValue(mediaItem.name, list, 'sourceItemName');
        item.target = document.createElement(mediaItem.target.tagName);
        item.target.src = mediaItem.target.src;
        item.target.srcObject = mediaItem.target.srcObject;
        item.mediaId = mediaItem.id;
        if(this.useWebGL && ['camera', 'video', 'image'].includes(item.mediaType)) {
            item.webGLObj = util.createWebGLObj(item.mediaType);
        }
        this.getItems('source').push(item);
        this.emit('sourceAdded', item);
        if (item.mediaType === 'audio') {
            this.emit('sceneAudioAdded', item);
        }
        this.setSelectedIndex('source', this.getItems('source').length - 1);
    }

    remove(type, index) {
        type = this._fixedType(type);
        if (!this.getItems(type).length || !this.getItems(type)[index]) return;
        const items = this.getItems(type);
        const item = items[index];
        if (this.mediaTypes.includes(type)) {
            this.data.scene.items.forEach((sceneItem, i) => {
                let selectedIndex = sceneItem.selectedIndex;
                const items = sceneItem.items;
                for (let j = items.length; j--;) {
                    if (items[j].mediaId === item.id) {
                        if (this.getSelectedIndex('scene') === i) {
                            this.remove('source', j);
                        } else {
                            items.splice(j, 1);
                        }
                        if (selectedIndex === j) {
                            if (j) {
                                selectedIndex--;
                            } else if (!items.length) {
                                selectedIndex = -1;
                            }
                        }
                    }
                }
                if (this.getSelectedIndex('scene') === i) {
                    if (selectedIndex !== sceneItem.selectedIndex) {
                        this.setSelectedIndex('source', selectedIndex);
                    }
                }
            });
        }
        if (item.elm) {
            const elms = Array.isArray(item.elm) ? item.elm : [item.elm];
            elms.forEach(elm => elm.remove());
            delete item.elm;
        }
        Animator.remove(item.id);
        items.splice(index, 1);
        const data = this._getData(type);
        if (data.selectedIndex === index) {
            if (index) {
                index--;
            } else if (!items.length) {
                index = -1;
            }
            this.setSelectedIndex('source', index);
        }
    }

    up(type) {
        this.move(type, -1);
    }

    down(type) {
        this.move(type, 1);
    }

    move(type, dir) {
        const i = this.getSelectedIndex(type);
        const items = this.getItems(type);
        if ((dir === -1 && i <= 0) || (dir === 1 && i >= items.length - 1)) return;
        const srcElm = items[i].elm;
        const dstElm = items[i + dir].elm;
        srcElm.remove();
        [items[i], items[i + dir]] = [items[i + dir], items[i]];
        if (dir === -1) {
            dstElm.parentElement.insertBefore(srcElm, dstElm);
        } else {
            dstElm.parentElement.insertBefore(srcElm, dstElm.nextSibling);
        }
        this._getData('source').selectedIndex = i + dir;
        //this.setSelectedIndex(type, i + dir);
    }

    rename(type, index, value) {
        this._getData(type).items[index].name = value;
    }

    setData(data) {

    }

    saveData() {

    }
}

export default new WebOBSData();