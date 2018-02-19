import util from './base/util.js';
import WebOBSData from './base/WebOBSData.js';
import { SceneListController } from './ListController/SceneListController.js';
import { SourceListController } from './ListController/SourceListController.js';
import { MixerListController } from './ListController/MixerListController.js';
import { CameraListController } from './ListController/CameraListController.js';
import { MicListController } from './ListController/MicListController.js';
import { VideoListController } from './ListController/VideoListController.js';
import { AudioListController } from './ListController/AudioListController.js';
import { ImageListController } from './ListController/ImageListController.js';
import { DesktopListController } from './ListController/DesktopListController.js';
import { SceneAudioListController } from './ListController/SceneAudioListController.js';
import { LayoutController } from './layout/LayoutController.js';

WebOBSData.useWebGL = true;

transitionSelect.oninput = evt => {
    WebOBSData.transition = transitionSelect.value;
}
transitionTime.oninput = evt => {
    WebOBSData.transitionTime = transitionTime.valueAsNumber;
}

window.addEventListener('dragenter', evt => {
    evt.preventDefault();
    const items = evt.dataTransfer.items;
    const item = items[0];
    const kind = item.kind;
    const type = item.type;
    if (kind === 'string') {

    } else if (kind === 'file') {
        const types = [];
        [...items].forEach(item => {
            const mediaType = item.type.split('/')[1];
            if (['png', 'jpg', 'jpeg'].includes(mediaType)) types.push('image');
            if (['wav', 'mp3', 'flac'].includes(mediaType)) types.push('audio')
            if (['ogg', 'webm', 'mp4'].includes(mediaType)) types.push('video');
        });
        const tabContents = document.querySelectorAll('.tab-content');
        document.querySelectorAll('.tab-content').forEach(tabContent => tabContent.style.display = 'none');
        if (types.length) {
            categoryTabHilighter.style.transform = `translateX(${1 * 100}%)`;
            mediaList.style.display = '';
        }
        if (types.includes('video')) {
            mediaTabHilighter.style.transform = `translateX(${0 * 100}%)`;
            videoList.style.display = '';
            //videoListDropArea.style.display = 'flex';
        } else if (types.includes('audio')) {
            mediaTabHilighter.style.transform = `translateX(${1 * 100}%)`;
            audioList.style.display = '';
            //audioListDropArea.style.display = 'flex';
        } else if (types.includes('image')) {
            mediaTabHilighter.style.transform = `translateX(${2 * 100}%)`;
            imageList.style.display = '';
            //imageListDropArea.style.display = 'flex';
        }
        if (types.includes('video') || types.includes('audio') || types.includes('image')) {
            //layoutAreaDropArea.style.display = 'flex';
        }
    }
}, true);




const cameraListView = new CameraListController('#cameraList');
const micListView = new MicListController('#micList');
const videoListView = new VideoListController('#videoList');
const audioListView = new AudioListController('#audioList');
const imageListView = new ImageListController('#imageList');
const sceneListView = new SceneListController('#sceneList');
const sourceListView = new SourceListController('#sourceList');
const mixerListView = new MixerListController('#mixerList');
const desktopListView = new DesktopListController('#desktopList');
const sceneAudioListView = new SceneAudioListController('#sceneAudioList');
window.layout = new LayoutController({
    cameraListView,
    micListView,
    desktopListView,
    audioListView,
    videoListView,
    imageListView,
    sceneListView,
    sourceListView
});