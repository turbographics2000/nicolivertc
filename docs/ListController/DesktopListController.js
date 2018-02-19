import util from '../base/util.js';
import WebOBSData from '../base/WebOBSData.js';
import { ListController } from './ListController.js';
import { DialogController } from '../base/DialogController.js';


export class DesktopListController extends ListController {
    constructor(selector) {
        super(selector, 'desktop');

        btnCaptureWindow.onclick = this.getDestopCapture.bind(this, 'window');
        btnCaptureTab.onclick = this.getDestopCapture.bind(this, 'tab');
        btnCaptureScreen.onclick = this.getDestopCapture.bind(this, 'screen');

        WebOBSData.on('desktopAdded', this.onDesktopAdded.bind(this));
        this.svp = {};
    }

    onDesktopAdded(item) {
        this.createItemElement(item);
    }

    getDestopCapture(type) {
        chrome.runtime.sendMessage(util.extensionId, { request: true, type }, res => {
            this.getStream(res);
        });
    }

    async getStream({ streamId, type }) {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: streamId
                }
            },
            audio: false
        });
        const video = document.createElement('video');
        const videoTrack = stream.getVideoTracks()[0];
        this.svp[videoTrack.id] = video;
        stream.getVideoTracks()[0].onended = evt => {
            const v = this.svp[evt.target.id];
            const index = this.getIndexFromElement(v);
            WebOBSData.remove(this.type, index);
        }
        video.autoplay = true;
        video.onloadedmetadata = evt => {
            const item = {
                id: streamId,
                name: util.generateUnusedValue(type, this.items),
                connecting: true,
                target: video,
                type,
                mediaType: 'desktop',
                visibility: true,
                locked: true,
                width: video.videoWidth,
                height: video.videoHeight,
                aspectRatio: video.videoWidth ? video.videoWidth / video.videoHeight : 0
            };
            WebOBSData.add(this.type, item);
        }
        video.srcObject = stream;
    }

    createItemElement(item, container, index) {
        const itemHeader = util.newElm({
            textContent: item.name,
            classes: ['item-header', 'ellipsis'],
            title: item.name
        });

        item.target.classList.add('item-target');

        item.elm = util.newElm({
            draggable: true,
            classes: ['item', 'grid', 'theme-color-l1'],
            children: [itemHeader, item.target],
            ondragstar: this.onDragStart.bind(this),
            ondragend: this.onDragEnd.bind(this)
        });

        this.container.appendChild(item.elm);
    }
}