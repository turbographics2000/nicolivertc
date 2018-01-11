import { SceneListController } from './scene/SceneListController.js';
import { SourceListController } from './source/SourceListController.js';
import { MixerListController } from './mixer/MixerListController.js';
import { CameraListController } from './camera/CameraListController.js';
import { MicListController } from './mic/MicListController.js';
import { VideoListController } from './video/VideoListController.js';
import { AudioListController } from './audio/AudioListController.js';
import { LayoutController } from './layout/LayoutController.js';
import { DesktopListController } from './desktop/DesktopListController.js';
import util from './base/util.js';


//let data = localStorage.getItem('saveData');
window.data = {
    selectedIndex: 0,
    items: [
        {
            id: `source_${util.generateUUID()}`,
            name: 'シーン 1',
            isSpecialScene: true,
            selectedIndex: 0,
            items: [
                {
                    id: `source_${util.generateUUID()}`,
                    name: 'ソース 1',
                    visibility: true,
                    locked: false,
                    target: null,
                    cx: 50,
                    cy: 50,
                    left: 0,
                    top: 0,
                    right: 100,
                    bottom: 100,
                    width: 100,
                    height: 100,
                    aspectRatio: 1,
                    threeDType: '2D'
                }
            ]
        },
        {
            id: `scene_${util.generateUUID()}`,
            name: 'シーン 3',
            isSpecialScene: false,
            selectedIndex: 0,
            items: [
                {
                    id: `source_${util.generateUUID()}`,
                    name: 'ソース 2',
                    visibility: true,
                    locked: true,
                    target: null,
                    cx: 150,
                    cy: 150,
                    left: 100,
                    top: 100,
                    right: 200,
                    bottom: 200,
                    width: 100,
                    height: 100,
                    aspectRatio: 1,
                    threeDType: 'SS_LR'
                }
            ]
        }
    ],
    mics: []
};

window.allSources = {}; // TODO
data.items.forEach(sceneItem => {
    sceneItem.items.forEach(sourceItem => window.allSources[sourceItem.id] = sourceItem);
});


window.addEventListener('contextmenu', evt => {
    evt.preventDefault();
});


window.dataLoading = true;
let selectedScene = data.items[data.selectedIndex];
let selectedSource = null;
const cameraListView = new CameraListController('#cameraList');
const micListView = new MicListController('#micList');
const videoListView = new VideoListController('#videoList');
const audioListView = new AudioListController('#audioList');
const sceneListView = new SceneListController('#sceneList');
const sourceListView = new SourceListController('#sourceList');
const mixerListView = new MixerListController('#mixerList');
const desktopListView = new DesktopListController('#desktopList');
window.layout = new LayoutController({
    cameraListView,
    micListView,
    audioListView,
    videoListView,
    sceneListView,
    sourceListView,
    data
});
window.dataLoading = false;

sceneListView.on('selectedIndexChanged', arg => {
    selectedScene = data.items[arg.newIndex];
    sourceListView.changeScene(data, selectedScene, arg);
});

sourceListView.on('selectedIndexChanged', arg => {
    selectedSource = selectedScene.items[arg.newIndex];
});
sourceListView.on('itemRemoved', ({ index, item }) => {
    layout.redraw();
});

cameraListView.on('selectedIndexChanged', arg => {
    console.log(arg);
});

// イベントハンドラーを設定した後にsetDataを行う
sceneListView.setData(data);

layout.on('dropped', item => {
    sourceListView.addItem(item);
});

sourceListView.on('itemAdded', (index, item) => {
    if (item.mediaType === 'audio') {
        audioListView.addItem(item);
    } else if (item.mediaType === 'video') {
        videoListView.addItem(item);
    }
});

layout.on('selectedObjectChanged', obj => {
    sourceListView.changeSelect(obj);
});

setTimeout(() => {
    layout.onResize();
}, 0);

btnCaptureWindow.onclick = evt => {
    const customEvent = new CustomEvent('request', {detail: 'window'});
    window.dispatchEvent(customEvent);
};
btnCaptureTab.onclick = evt => {
    const customEvent = new CustomEvent('request', {detail: 'tab'});
    window.dispatchEvent(customEvent);
};
btnCaptureScreen.onclick = evt => {
    const customEvent = new CustomEvent('request', {detail: 'screen'});
    window.dispatchEvent(customEvent);
};

window.addEventListener('desktopStreamId', evt => {
    desktopListView.getItems(evt.detail);
});

//cameraList.getItems();


// window.addEventListener('streamId', evt => {
//     const sender = evt.detail.sender;
// });

transitionSelect.value = 'fade';
transitionTime.value = 300;


