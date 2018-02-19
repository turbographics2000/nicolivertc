import util from '../base/util.js';
import WebOBSData from '../base/WebOBSData.js';
import { ListController } from './ListController.js';
import { DialogController } from '../base/DialogController.js';


export class SceneAudioListController extends ListController {
    constructor(selector) {
        super(selector, 'sceneAudio');
        WebOBSData.on('sceneAudioAdded', this.onSceneAudioAdded.bind(this));
    }

    onSceneAudioAdded(item) {
        this.createItemElement(item);
    }

    setupAudioPlayer(item) {
        const playingPosition = document.createElement('div');
        playingPosition.classList.add('playingposition');
        playingPosition.style.display = 'none';
        let audioPlayingId = null;

        let itemWidth = 0;
        item.target.addEventListener('play', evt => {
            playingPosition.style.display = '';
            itemWidth = item.waveformThumb.getBoundingClientRect().width;
            audioPlaying();
        });
        item.target.addEventListener('pause', evt => {
            playingPosition.style.display = 'none';
            if (audioPlayingId) {
                cancelAnimationFrame(audioPlayingId);
                audioPlayingId = null;
            }
        });
        function audioPlaying() {
            audioPlayingId = requestAnimationFrame(audioPlaying);
            playingPosition.style.left = `${item.target.currentTime / item.target.duration * itemWidth}px`;
        }
        return playingPosition;
    }

    createItemElement(item, container, index) {
        const removeButton = util.newElm({
            textContent: 'clear',
            classes: ['item-remove-button', 'material-icons'],
            onclick: evt => WebOBSData.remove('source', this.getIndexFromElement(evt.target))
        });

        const itemName = util.newElm({
            textContent: item.sourceItemName,
            classes:['item-name', 'ellipsis']
        });
        
        const itemHeader = util.newElm({
            classes: ['item-header', 'grid'],
            title: item.sourceItemName,
            children: [itemName, removeButton]
        });

        const itemChildren = [itemHeader];
        
        if (item.waveformThumb) {
            if(item.waveformThumb.parentElement) {
                item.waveformThumb = item.waveformThumb.cloneNode();
            }
            item.waveformThumb.classList.add('waveform');
            const playingPosition = this.setupAudioPlayer(item);
            itemChildren.push(item.waveformThumb, playingPosition);
        } else {
            let audioMeter = util.newElm({
                classes: ['item-audio-meter']
            });
            let audioMeterContainer = util.newElm({
                classes: ['item-audio-meter-container'],
                children: [audioMeter]
            });
            itemChildren.push(audioMeterContainer);
        }
        
        const elm = util.newElm({
            draggable: true,
            classes: ['item', 'grid', 'theme-color-l1'],
            children: itemChildren
        });
        item.elm.push(elm);
        
        this.container.appendChild(elm);
        //super.createItemElement(item, container, index);
    }
}