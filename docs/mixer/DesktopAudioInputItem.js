import { AudioInputItem } from "./AudioInputItem.js";
import util from '../base/util.js';

export class DesktopAudioInputItem extends AudioInputItem {
    constructor(options) {
        super(options);
    }

    get name() {
        return 'デスクトップ音声';
    }

    async getConstraints() {
        // return {  // Electron
        //     audio: {
        //         mandatory: {
        //             chromeMediaSource: 'desktop',
        //         }
        //     },
        //     video: {
        //         mandatory: {
        //             chromeMediaSource: 'desktop'
        //         }
        //     }
        // }
        if (chrome) {
            const streamId = await (_ => {
                return new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage(util.extensionId, { request: true, type: 'screen' }, res => {
                        resolve(res.streamId);
                    });
                });
            })();
            return {
                audio: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: streamId
                    }
                },
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: streamId
                    }
                }
            };    
        } else  if(InstallTrigger) { // Firefox
            return {
                audio: true,
                video: false
            }
        }

    }

    setting() {
        if (this.dialog) {
            this.dialog.show(''); // TODO
        }
    }
}