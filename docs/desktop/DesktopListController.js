import { ItemManager } from '../base/ItemManager.js';
import { ListController } from '../base/ListController.js';
import { DialogController } from '../base/DialogController.js';
import { PlayerController } from '../base/PlayerController.js';
import util from '../base/util.js';


export class DesktopListController extends ListController {
    constructor(selector, options = {}) {
        super(selector, Object.assign({}, options, {
            selectable: false,
            items: new ItemManager()
        }));
    }

    getItems(streamId, type) {
        navigator.mediaDevices.getUserMedia({
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: streamId
                }
            }
        }).then(stream => {
            const video = document.createElement('video');
            video.autoplay = true;
            video.onloadedmetadata = evt => {
                const item = {
                    name: util.generateUnusedValue(type, this.list),
                    connecting: true,
                    target: video,
                    type,
                    mediaType: 'desktop',
                    visibility: true,
                    locked: true,
                    width: video.videoWidth,
                    height: video.videoHeight,
                    aspectRatio: video.videoWidth ? video.videoWidth / video.videoHeight : 0
                };
                super.addItem(item);
            }
        }).catch(err => {
            console.log('desktop capture error', err);
        });
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