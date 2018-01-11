import { ListController } from '../base/ListController.js';
import { AudioItemManager } from './AudioItemManager.js';
import { DialogController } from '../base/DialogController.js';
import { PlayerController } from '../base/PlayerController.js';
import util from '../base/util.js';


export class AudioListController extends ListController {
    constructor(selector, options = {}) {
        super(selector, Object.assign({}, options, {
            selectable: false,
            items: new AudioItemManager(options)
        }));

        this.players = {};
    }

    async createItemElement(item, container, index) {
        const itemHeader = util.newElm({
            textContent: item.name,
            classes: ['item-header', 'drag-target-name', 'ellipsis']
        });
        item.waveformImage = await util.generateWaveformImage(item.file, 240, 105);
        item.waveformImage.classList.add('waveform');

        const playingPosition = util.newElm({
            classes: ['playingposition'],
        });

        const controllerContainer = util.newElm({
            classes: ['player-controller-container']
        });
        this.players[item.name] = new PlayerController(item.target, controllerContainer, playingPosition);

        const itemElm = util.newElm({
            attributes: { draggable: true },
            classes: ['item'],
            children: [itemHeader, item.waveformImage, playingPosition, controllerContainer]
        });

        itemElm.ondragstart = this.onDragStart.bind(this);
        itemElm.ondragend = this.onDragEnd.bind(this);
        this.container.appendChild(itemElm);
        //super.createItemElement(item, container, index);
    }

    itemRemoved({ index, item }) {
        this.players[item.name].dispose();
        delete this.players[item.name];
        super.itemRemoved({ index, item });
    }
}