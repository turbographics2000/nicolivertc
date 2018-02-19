import util from '../base/util.js';
import WebOBSData from '../base/WebOBSData.js';
import { ListController } from './ListController.js';
import { DialogController } from '../base/DialogController.js';
import { PlayerController } from '../base/PlayerController.js';

export class VideoListController extends ListController {
    constructor(selector) {
        super(selector, 'video');
        WebOBSData.on('videoAdded', this.onVideoAdded.bind(this));
    }

    onVideoAdded(item) {
        this.createItemElement(item);
    }

    onClick() { } // プレイヤーコントローラーや削除ボタンなど、クリック要素があるため、アイテムのクリックを無効にする

    createItemElement(item) {
        const removeButton = util.newElm({
            textContent: 'clear',
            classes: ['item-remove-button', 'material-icons'],
            onclick: evt => this.onBtnRemoveClick(this.getIndexFromElement(evt.target))
        });
        
        const itemName = util.newElm({
            textContent: item.name,
            classes: ['item-name', 'ellipsis']
        });

        const itemHeader = util.newElm({
            classes: ['item-header', 'grid'],
            title: item.name,
            children: [itemName, removeButton]
        });

        const controllerContainer = util.newElm({
            classes: ['item-player-controller-container']
        });

        item.controller = new PlayerController(item, controllerContainer);

        item.target.classList.add('item-target');

        item.elm = util.newElm({
            draggable: true,
            classes: ['item', 'grid', 'theme-color-l1'],
            children: [itemHeader, item.target, controllerContainer],
            ondragstart: this.onDragStart.bind(this),
            ondragend: this.onDragEnd.bind(this)
        });

        this.container.appendChild(item.elm);
    }
}