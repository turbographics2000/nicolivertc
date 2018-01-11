import { ListController } from '../base/ListController.js';
import { VideoItemManager } from './VideoItemManager.js';
import { DialogController } from '../base/DialogController.js';
import { PlayerController } from '../base/PlayerController.js';
import util from '../base/util.js';


export class VideoListController extends ListController {
    constructor(selector, options = {}) {
        super(selector, Object.assign({}, options, {
            selectable: false,
            items: new VideoItemManager(options)
        }));
    }

    createItemElement(item, container, index) {
        const itemHeader = util.newElm({
            textContent: item.name,
            classes: ['item-header', 'drag-target-name', 'ellipsis']
        });
        const controllerContainer = util.newElm({
            classes:['player-controller-container']
        });
        const controller = new PlayerController(item.target, controllerContainer);
        const itemElm = util.newElm({
            attributes: { draggable: true },
            classes: ['item'],
            children: [itemHeader, item.target, controllerContainer]
        });
        itemElm.ondragstart = this.onDragStart.bind(this);
        itemElm.ondragend = this.onDragEnd.bind(this);
        this.container.appendChild(itemElm);
    }

    // onDragStart(evt) {
    //     console.log(evt.currentTarget, evt.target);
    //     // Firefoxではデータがセットされてないとダメ
    //     evt.dataTransfer.setData('text/plain', 'dummy');
    //     const video = evt.target.querySelector('video');
    //     this.draggingTarget = {
    //         name: evt.target.querySelector('.drag-target-name').textContent,
    //         target: video,
    //         type: 'video',
    //         width: video.videoWidth,
    //         height: video.videoHeight
    //     };
    // }

    // onDragEnd(evt) {
    //     this.draggingTarget = null;
    // }
}