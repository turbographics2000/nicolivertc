import { EventEmitter } from '../base/EventEmitter.js';

export class AudioInputItem extends EventEmitter {
    constructor(options) {
        super(options);

        this.audio = new Audio();
        this.audio.autoplay = true;
        this.audio.volume = 0;
        this.state = 'stop';
    }

    get muted() {
        return this.audio.muted;
    }
    set muted(value) {
        this.audio.muted = value;
    }
    
    get volume() {
        return this.audio.volume * 100;
    }
    set volume(value) {
        this.audio.volume = value / 100;
    }

    getStream() {
        return navigator.mediaDevices.getUserMedia(this.constraints).then(stream => {
            stream.getVideoTracks().forEach(track => {
                track.stop();
                stream.removeTrack(track);
            });
            if(this.audio.srcObject) {
                this.releaseStream();
            }
            this.audio.srcObject = stream;
            this.stateChange('started');
        }).catch(error => {
            this.stateChange('error', error);
        });
    }

    releaseStream() {
        this.audio.pause();
        const stream = this.audio.srcObject;
        this.audio.srcObject = null;
        stream.getTracks().forEach(track => {
            track.stop();
            this.stream.removeTrack(track);
        });
        stream = null;
        this.stateChange('stopped');
    }

    stateChange(state, error) {
        this.state = state;
        this.emit('stateChanged', this, state, error);
    }
}