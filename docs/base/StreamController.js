
//import playerAnimation from './PlayerAnimation.js';
import Animator from './Animator.js';
import util from '../base/util.js';

export class StreamController {
    constructor(item, container) {
        this.item = item;
        this.volumeButton = util.newElm({
            textContent: 'volume_up',
            classes: ['material-icons', 'volume-button'],
            attributes: {
                onclick: this.onClick_volumeButton.bind(this)
            }
        });
        this.volumePoint = util.newElm({
            classes: ['volume-point']
        });
        this.volumeBar = util.newElm({
            classes: ['volume-bar'],
            children: [this.volumePoint]
        });
        this.volumeBarContainer = util.newElm({
            classes: ['volume-bar-container'],
            children: [this.volumeBar]
        });
        this.volumeContainer = util.newElm({
            classes: ['volume-container'],
            attributes: {
                onmousedown: this.onVolumeContainerMouseDown.bind(this)
            },
            children: [this.volumeBarContainer]
        });
        this.controller = util.newElm({
            classes: ['player-controller', 'grid'],
            children: [this.volumeButton, this.volumeContainer]
        });

        this.muted = false;
        this.gainValue = this.item.gainNode.gain.value;
        this.container = container;
        this.container.appendChild(this.controller);
        this.diffX = 0;
        this.callback = null;
        this.bindedMouseMove = this.mouseMove.bind(this);
        this.bindedMouseUp = this.mouseUp.bind(this);
        this.volumeBar.style.width = `${this.gainValue * 100 | 0}%`;
    }

    dispose() {
        this.container.innerHTML = '';
        this.container = null;
    }

    onVolumeContainerMouseDown(evt) {
        this.barContainer = this.volumeBarContainer;
        this.bar = this.volumeBar;
        evt.preventDefault();
        this.diffX = evt.pageX - evt.offsetX;
        this.setPos(evt.pageX);
        window.addEventListener('mousemove', this.bindedMouseMove);
        window.addEventListener('mouseup', this.bindedMouseUp);
    };

    onClick_volumeButton(evt) {
        this.muted = !this.muted;
        //this.item.gainNode.gain.value = this.muted ? 0 : this.gainValue;
        this.item.gainNode.gain.setValueAtTime(this.muted ? 0 : this.gainValue, util.audioContext.currentTime);
        this.volumeBar.width = this.muted ? 0 : `${this.gainValue * 100}%`;
        this.setVolumeIcon();
    }

    mouseMove(evt) {
        this.setPos(evt.pageX);
    }

    mouseUp(evt) {
        window.removeEventListener('mousemove', this.bindedMouseMove);
        window.removeEventListener('mouseup', this.bindedMouseUp);
    }

    setPos(x) {
        x = x - this.diffX;
        this.gainValue = x / this.barContainer.getBoundingClientRect().width;
        this.gainValue = Math.max(0.0, Math.min(this.gainValue, 1.0));
        this.volumeBar.style.width = `${this.gainValue * 100 | 0}%`;
        if(!this.muted) {
            //this.item.gainNode.gain.value = this.gainValue;
            this.item.gainNode.gain.setValueAtTime(this.gainValue, util.audioContext.currentTime);
        }
        this.setVolumeIcon();
    }

    setVolumeIcon() {
        if (this.muted) {
            this.volumeButton.textContent = 'volume_off';
        } else if (this.gainValue === 0) {
            this.volumeButton.textContent = 'volume_mute';
        } else if (this.gainValue < 0.5) {
            this.volumeButton.textContent = 'volume_down';
        } else {
            this.volumeButton.textContent = 'volume_up';
        }
    }
}