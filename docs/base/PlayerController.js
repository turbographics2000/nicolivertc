
import util from '../base/util.js';

export class PlayerController {
    constructor(mediaElement, container, playingPosition) {
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
            classes: ['player-controller'],
            children: [this.playButton, this.seekContainer, this.volumeButton, this.volumeContainer]
        });

        this.container = container;
        this.containerWidth = 0;
        this.container.appendChild(this.playerController);
        this.mediaElement = mediaElement;
        this.mediaElement.onplay = this.onPlay.bind(this);
        this.mediaElement.onpause = this.onPause.bind(this);
        this.diffX = 0;
        this.containerWidth = 0;
        this.barContainer = null;
        this.bar = null;
        this.point = null;
        this.callback = null;
        this.playingRafId = null;
        this.bindedSeekMove = this.seekmove.bind(this);
        this.bindedSeekUp = this.seekup.bind(this);
        this.playingPosition = playingPosition;

        setTimeout(_ => {
            this.setVolumeBar();
        }, 0);
    }

    dispose() {
        this.container.innerHTML = '';
        this.container = null;
        this.mediaElement.onpause = null;
        this.mediaElement = null;
        this.playingPosition = null;
    }

    onSeekContainerMouseDown(evt) {
        this.barContainer = this.seekBarContainer;
        this.bar = this.seekBar;
        this.point = this.seekPoint;
        this.callback = ratio => {
            this.mediaElement.currentTime = this.mediaElement.duration * ratio;
        };
        this.seekdown(evt);
    };

    onVolumeContainerMouseDown(evt) {
        this.barContainer = this.volumeBarContainer;
        this.bar = this.volumeBar;
        this.point = this.volumePoint;
        this.callback = ratio => {
            this.mediaElement.volume = ratio;
            this.setVolumeIcon();
        }
        this.seekdown(evt);
    };

    onPlay(evt) {
        if(this.playingPosition) {
            //this.playingPosition.style.display = '';
        }
    }

    onPause(evt) {
        if(this.playingPosition) {
            //this.playingPosition.style.display = 'none';
        }
        this.playButton.textContent = 'play_arrow';
        if (this.playingRafId) cancelAnimationFrame(this.playingRafId);
    }

    onClick_playButton(evt) {
        if (this.mediaElement.paused) {
            this.containerWidth = this.container.getBoundingClientRect().width;
            this.mediaElement.play();
            this.playingRaf();
            this.playButton.textContent = 'pause';
        } else {
            this.mediaElement.pause();
            cancelAnimationFrame(this.playingRafId);
            this.playButton.textContent = 'play_arrow';
        }
    }

    onClick_volumeButton(evt) {
        this.mediaElement.muted = !this.mediaElement.muted;
        this.setVolumeIcon();
        this.setVolumeBar();
    }

    setSeekPos(x) {
        x = x - this.diffX;
        x = Math.max(0, Math.min(x, this.containerWidth - 16));
        this.bar.style.width = `${x}px`;
        this.point.style.left = `${x}px`;
        let ratio = x / (this.containerWidth - 16);
        this.callback(ratio);
    }

    seekmove(evt) {
        this.setSeekPos(evt.pageX);
    }

    seekup(evt) {
        window.removeEventListener('mousemove', this.bindedSeekMove);
        window.removeEventListener('mouseup', this.bindedSeekUp);
    }

    seekdown(evt) {
        this.containerWidth = this.barContainer.getBoundingClientRect().width;
        const offsetX = evt.offsetX;
        this.diffX = evt.pageX - evt.offsetX;
        evt.preventDefault();
        this.setSeekPos(evt.pageX);
        window.addEventListener('mousemove', this.bindedSeekMove);
        window.addEventListener('mouseup', this.bindedSeekUp);
    }

    playingRaf() {
        this.playingRafId = requestAnimationFrame(this.playingRaf.bind(this));
        const width = this.seekBarContainer.getBoundingClientRect().width - 16;
        const left = this.mediaElement.currentTime / this.mediaElement.duration * width
        this.seekBar.style.width = `${left}px`;
        this.seekPoint.style.left = `${left}px`;
        if(this.playingPosition) {
            const left = this.mediaElement.currentTime / this.mediaElement.duration * this.containerWidth;
            this.playingPosition.style.left = `${left}px`;
        }
    }

    setVolumeBar() {
        const width = (this.volumeBarContainer.getBoundingClientRect().width || 60) - 16;
        let left = this.mediaElement.muted ? 0 : this.mediaElement.volume * width;
        this.volumeBar.style.width = `${left}px`;
        this.volumePoint.style.left = `${left}px`;
        this.setVolumeIcon();
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