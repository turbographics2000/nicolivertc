import { ListController } from '../base/ListController.js';
import { AudioOfSceneItemManager } from './AudioOfSceneItemManager.js';
import { DialogController } from '../base/DialogController.js';
import util from '../base/util.js';


export class AudioOfSceneListController extends ListController {
    constructor(selector, options = {}) {
        super(selector, Object.assign({}, options, {
            selectable: false,
            items: new AudioOfSceneItemManager(options)
        }));
    }

    setupAudioPlayer(item) {
        const playingPosition = document.createElement('div');
        playingPosition.classList.add('source-playingposition');
        playingPosition.style.display = 'none';
        let audioPlayingId = null;

        item.target.onplay = function (evt) {
            playingPosition.style.display = '';
            audioPlaying();
        };
        item.target.onpause = function (evt) {
            playingPosition.style.display = 'none';
            if (audioPlayingId) {
                cancelAnimationFrame(audioPlayingId);
                audioPlayingId = null;
            }
        };
        function audioPlaying() {
            audioPlayingId = requestAnimationFrame(audioPlaying);
            // TODO　直値で指定しているのを何とかする
            playingPosition.style.left = `${item.target.currentTime / item.target.duration * 318}px`;
        }
        return playingPosition;
    }

    createItemElement(item, container, index) {
        const itemHeader = util.newElm({
            textContent: item.name,
            classes: ['source-item-header', 'drag-target-name', 'ellipsis']
        });
        item.target.classList.add('source-audio');
        item.target.classList.add('drag-target');
        item.target.controls = true;
        item.waveformImage.classList.add('source-waveform');
        const playingPosition = this.setupAudioPlayer(item);
        const itemElm = util.newElm({
            attributes: { draggable: true },
            classes: ['source-item'],
            children: [label, item.waveformImage, playingPosition, item.target]
        });
        itemElm.ondragstart = this.onDragStart.bind(this);
        itemElm.ondragend = this.onDragEnd.bind(this);
        mediaListBody.appendChild(itemElm);
        //super.createItemElement(item, container, index);
    }

    onDragStart(evt) {
        // Firefoxではデータがセットされてないとダメ
        evt.dataTransfer.setData('text/plain', 'dummy');
        const video = evt.target.querySelector('.source-video');
        this.draggingTarget = {
            name: evt.target.querySelector('.source-label').textContent,
            target: video,
            type: 'camera',
            width: video.videoWidth,
            height: video.videoHeight
        };
    }

    onDragEnd(evt) {
        this.draggingTarget = null;
    }
}