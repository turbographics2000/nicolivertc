import { AudioInputItem } from "./AudioInputItem.js";

export class DesktopAudioInputItem extends AudioInputItem {
    constructor(options) {
        super(options);
    }

    get name() {
        return 'デスクトップ音声';
    }

    get constraints() {
        return {  // Electron
            audio: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                }
            },
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop'
                }
            }
        }
    }

    setting() {
        if(this.dialog) {
            this.dialog.show(''); // TODO
        }
    }
}