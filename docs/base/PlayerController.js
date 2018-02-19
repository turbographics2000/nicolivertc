
//import playerAnimation from './PlayerAnimation.js';
import Animator from './Animator.js';
import util from '../base/util.js';

export class PlayerController {
    constructor(item, container, playingPosition) {
        this.item = item;
        this.playButton = util.newElm({
            textContent: 'play_arrow',
            classes: ['material-icons', 'play-button'],
            attributes: {
                onclick: this.onClick_playButton.bind(this)
            }
        });
        this.seekPoint = util.newElm({
            classes: ['seek-point']
        });
        this.seekBar = util.newElm({
            classes: ['seek-bar'],
            children: [this.seekPoint]
        });
        this.seekBarContainer = util.newElm({
            classes: ['seek-bar-container'],
            children: [this.seekBar]
        });
        this.seekContainer = util.newElm({
            classes: ['seek-container'],
            attributes: {
                onmousedown: this.onSeekContainerMouseDown.bind(this)
            },
            children: [this.seekBarContainer]
        });
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
        this.playerController = util.newElm({
            classes: ['player-controller', 'grid'],
            children: [this.playButton, this.seekContainer, this.volumeButton, this.volumeContainer]
        });

        this.container = container;
        this.container.appendChild(this.playerController);
        this.diffX = 0;
        this.callback = null;
        this.mediaElement = item.target;
        this.mediaElement.addEventListener('play', this.onPlay.bind(this));
        this.mediaElement.addEventListener('pause', this.onPause.bind(this));
        this.mediaElement.addEventListener('ended', this.onEnded.bind(this));
        this.bindedSeekMove = this.seekmove.bind(this);
        this.bindedSeekUp = this.seekup.bind(this);
        this.playingPosition = playingPosition;
        this.volumeBar.style.width = `${this.mediaElement.volume * 100 | 0}%`;
    }

    dispose() {
        this.container.innerHTML = '';
        this.container = null;
        this.mediaElement.onpause = null;
        this.mediaElement = null;
        this.playingPosition = null;
    }

    onPlay(evt) {
        this.playButton.textContent = 'pause';
        Animator.add({
            id: this.item.id,
            mediaType: this.item.mediaType,
            player: this.item.target,
            playingPosition: this.playingPosition,
            seekBar: this.seekBar
        });
    }

    onPause(evt) {
        this.playButton.textContent = 'play_arrow';
        Animator.remove(this.item.id, this.item.mediaType);
    }

    onEnded(evt) {
    }

    onSeekContainerMouseDown(evt) {
        this.barContainer = this.seekBarContainer;
        this.callback = ratio => {
            this.mediaElement.currentTime = this.mediaElement.duration * ratio;
            if(this.playingPosition) {
                this.playingPosition.style.left = ratio ? `${ratio * 100}%` : '';
            }
            if(this.seekBar) {
                this.seekBar.style.width = `${ratio * 100}%`;
            }
        };
        this.seekdown(evt);
    };

    onVolumeContainerMouseDown(evt) {
        this.barContainer = this.volumeBarContainer;
        this.bar = this.volumeBar;
        this.callback = ratio => {
            this.volumeBar.style.width = `${ratio * 100 | 0}%`;
            this.mediaElement.volume = ratio;
            this.setVolumeIcon();
        }
        this.seekdown(evt);
    };

    onClick_playButton(evt) {
        if (this.mediaElement.paused) {
            this.mediaElement.play();
        } else {
            this.mediaElement.pause();
        }
    }

    onClick_volumeButton(evt) {
        this.mediaElement.muted = !this.mediaElement.muted;
        if(this.mediaElement.muted) {
            this.volumeBar.width = 0;
        } else {
            this.volumeBar.width = `${this.mediaElement.volume * 100}%`;
        }
        this.setVolumeIcon();
    }

    seekdown(evt) {
        evt.preventDefault();
        this.diffX = evt.pageX - evt.offsetX;
        this.setSeekPos(evt.pageX);
        window.addEventListener('mousemove', this.bindedSeekMove);
        window.addEventListener('mouseup', this.bindedSeekUp);
    }

    seekmove(evt) {
        this.setSeekPos(evt.pageX);
    }

    seekup(evt) {
        window.removeEventListener('mousemove', this.bindedSeekMove);
        window.removeEventListener('mouseup', this.bindedSeekUp);
    }

    setSeekPos(x) {
        x = x - this.diffX;
        let ratio = x / this.barContainer.getBoundingClientRect().width;
        ratio = Math.max(0.0, Math.min(ratio, 1.0));
        this.callback(ratio);
    }

    setVolumeIcon() {
        if (this.mediaElement.muted) {
            this.volumeButton.textContent = 'volume_off';
        } else if (this.mediaElement.volume === 0) {
            this.volumeButton.textContent = 'volume_mute';
        } else if (this.mediaElement.volume < 0.5) {
            this.volumeButton.textContent = 'volume_down';
        } else {
            this.volumeButton.textContent = 'volume_up';
        }
    }
}