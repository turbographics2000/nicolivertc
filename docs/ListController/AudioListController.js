import util from '../base/util.js';
import WebOBSData from '../base/WebOBSData.js';
import { ListController } from './ListController.js';
import { DialogController } from '../base/DialogController.js';
import { PlayerController } from '../base/PlayerController.js';

export class AudioListController extends ListController {
    constructor(selector) {
        super(selector, 'audio');
        WebOBSData.on('audioAdded', this.onAudioAdded.bind(this));
    }

    onAudioAdded(item) {
        this.createItemElement(item);
    }

    async createItemElement(item) {
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

        item.waveformImage.classList.add('waveform');
        item.waveformImage.classList.add('item-target');

        const playingPosition = util.newElm({
            classes: ['item-playing-position'],
        });

        const controllerContainer = util.newElm({
            classes: ['item-player-controller-container']
        });
        item.controller = new PlayerController(item, controllerContainer, playingPosition);

        item.elm = util.newElm({
            draggable: true,
            classes: ['item', 'grid', 'theme-color-l1'],
            children: [itemHeader, item.waveformImage, playingPosition, controllerContainer],
            ondragstart: this.onDragStart.bind(this),
            ondragend: this.onDragEnd.bind(this)
        });

        this.container.appendChild(item.elm);
    }

    removeItem() {

    }
}