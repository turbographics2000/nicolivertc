import { DeviceWatcher } from './DeviceWatcher.js';


class Util {
    constructor() {
        this.audioContext = new AudioContext();
        this.setupSourceList();
        this.createThreeDTypeDropdownList();
        this.deviceWatcher = new DeviceWatcher();

        window.addEventListener('click', evt => {
            document.querySelectorAll('.flowlist').forEach(elm => elm.classList.remove('show'));
        }, true);
    }

    setupSourceList() {
        this.setupTab(document.querySelector('#inputList'));
        this.setupTab(document.querySelector('.capture-device-list'));
        this.setupTab(document.querySelector('.media-list'));
    }

    setupTab(container) {
        const tabs = container.querySelectorAll(':scope > .tab-container > .tab');
        const tabContents = container.querySelectorAll(':scope > .tab-content-container > .tab-content');
        const tabHilighter = container.querySelector(':scope > .tab-hilighter-container > .tab-hilighter')
        tabs.forEach((tab, i) => {
            tab.dataset.index = i;
            tab.onclick = function (evt) {
                changeTab(+this.dataset.index);
            };
            if (tab.classList.contains('selected')) changeTab(+tab.dataset.index);
        });
        tabHilighter.style.width = `${100 / tabs.length}%`;

        function changeTab(index) {
            tabs.forEach(tab => tab.classList.remove('selected'));
            tabs[index].classList.add('selected');
            tabHilighter.style.transform = `translateX(${index * 100}%)`;
            tabContents.forEach(tabContent => tabContent.style.display = 'none');
            tabContents[index].style.display = 'block';
        }
    }

    newElm({ tagName = 'div', type, classes, attributes, styles, dataset, textContent, value, selected, children }) {
        const elm = document.createElement(tagName);
        if (type) elm.type = type;
        if(classes) {
            if(!Array.isArray(classes)) classes = [classes];
            classes.forEach(c => c && elm.classList.add(c));
        }
        Object.keys(attributes || {}).forEach(atrName => {
            elm[atrName] = attributes[atrName]
        });
        Object.keys(styles || {}).forEach(styleName => {
            elm.style[styleName] = styles[styleName];
        });
        Object.keys(dataset || {}).forEach(dsName => {
            elm.dataset[dsName] = dataset[dsName];
        });
        if (textContent) elm.textContent = textContent;
        if (selected) elm.selected = true;
        if (value) elm.value = value;
        if(children) {
            if(!Array.isArray(children)) children = [children];
            children.forEach(child => {
                elm.appendChild(child);
            });
        }
        return elm;
    }

    flowListShow(flowList, x, y, idx) {
        document.querySelectorAll('.flowlist').forEach(elm => elm.classList.remove('show'));
        flowList.style.left = `${x}px`;
        flowList.style.top = `${y}px`;
        flowList.classList.add('show');
        flowList.dataset.idx = idx;
    }

    flowListHide(flowList) {
        flowList.classList.remove('show');
    }

    generateUUID() {
        let ms = new MediaStream();
        const uuid = ms.id;
        ms = null;
        return uuid;
    }

    generateUnusedValue(prefix, list, propertyName = 'name') {
        for (let n = 1; n <= 100; n++) {
            const value = `${prefix} ${n === 1 ? '' : n}`;
            if (!list.filter(item => item[propertyName] === value).length) {
                 return value;
            }
        }
    }

    imageLoad(file) {
        return new Promise((resolve, reject) => {
            var src = URL.createObjectURL(file);
            var img = new Image();
            img.onload = evt => {
                resolve({
                    name: file.name,
                    target: img,
                    mediaType: 'image',
                    width: img.naturalWidth,
                    height: img.naturalHeight
                });
            };
            img.onerror = evt => {
                img = null;
                URL.revokeObjectURL(src);
                reject(evt);
            };
            img.src = src;
        });
    }

    audioLoad(file) {
        return new Promise((resolve, reject) => {
            var src = URL.createObjectURL(file);
            var audio = new Audio();
            audio.onloadedmetadata = evt => {
                resolve({ 
                    name: file.name, 
                    target:audio, 
                    mediaType: 'audio',
                    width: 0,
                    height: 0 
                });
            };
            audio.onerror = evt => {
                audio = null;
                URL.revokeObjectURL(src);
                reject();
            };
            audio.src = src;
        });
    }

    videoLoad(file) {
        return new Promise((resolve, reject) => {
            var src = URL.createObjectURL(file);
            var video = document.createElement('video');
            video.onloadedmetadata = evt => {
                let mediaType = 'video';
                if (!video.videoWidth && !video.videoHieght) {
                    video = null;
                    var audio = new Audio();
                    audio.onloadeddata = evt => {
                        resolve({
                            name: file.name,
                            target: audio,
                            mediaType: 'audio',
                            width: 0,
                            height: 0,
                            file
                        });
                    };
                    audio.onerror = evt => {
                        reject(evt);
                    };
                    audio.src = src;
                } else {
                    resolve({
                        name: file.name,
                        target: video,
                        mediaType: 'video',
                        width: video.videoWidth,
                        height: video.videoHeight,
                        degree360: false,
                        stereoscopicType: '2D'
                    });
                }
            };
            video.onerror = evt => {
                video = null;
                URL.revokeObjectURL(src);
                reject();
            };
            video.src = src;
        });
    }

    async parseMediaFileType(file) {
        const ab = await this.blobToArrayBuffer(file);
        let bin = new Uint32Array(ab, 0, 2);
        let type = null;
        if (bin[0] === 0x474e5089) type = `png`;
        else if (bin[0] === 0xe0ffd8ff) type = `jpg`;
        else if (bin[0] === 0x46464952) type = `wav`;
        else if (bin[0] === 0x03334449) type = `mp3`;
        else if (bin[0] === 0x43614c66) type = `flac`;
        else if (bin[0] === 0x5367674f) type = `ogg`;
        else if (bin[0] === 0xa3df451a) type = `webm`;
        else if (bin[1] === 0x70797466) type = `mp4`;
        else throw new Error('unsupported file.');
        return type;
    }

    blobToArrayBuffer(blob) {
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = evt => {
                resolve(fr.result);
            };
            fr.onerror = evt => {
                reject(evt);
            };
            fr.readAsArrayBuffer(blob);
        });
    };

    async generateWaveformImage(file, w, h, color = '#d0782a') {
        try {
            let arrayBuffer = await (_ => {
                return new Promise((resolve, reject) => {
                    const fr = new FileReader();
                    fr.onload = evt => {
                        resolve(fr.result);
                    };
                    fr.onerror = evt => {
                        reject(evt);
                    };
                    fr.readAsArrayBuffer(file);
                });
            })();
            const buffer = await this.audioContext.decodeAudioData(arrayBuffer);
            const channels = buffer.numberOfChannels;
            const cnv = document.createElement('canvas');
            cnv.width = w;
            cnv.height = h;
            const ctx = cnv.getContext('2d');
            ctx.clearRect(0, 0, w, h);
            for (let ch = 0; ch < channels; ch++) {
                const data = buffer.getChannelData(ch);
                var step = data.length / w | 0;
                var amp = h / (2 * channels);
                var offset = h / channels * ch;
                ctx.fillStyle = color;
                for (var i = 0; i < w; i++) {
                    var min = 1.0;
                    var max = -1.0;
                    for (var j = 0; j < step; j++) {
                        var datum = data[(i * step) + j];
                        min = datum < min ? datum : min;
                        max = datum > max ? datum : max;
                    }
                    ctx.fillRect(i, (1 + min) * amp + offset, 1, Math.max(1, (max - min) * amp));
                }
            }
            const img = await (_ => {
                return new Promise((resolve, reject) => {
                    cnv.toBlob(blob => {
                        const img = new Image();
                        img.src = URL.createObjectURL(blob);
                        resolve(img);
                    });
                });
            })();
            return img;
        } catch (err) {
            console.log(err);
        }
    }

    createThreeDTypeDropdownList() {
        window.threeDTypeDropdownList = this.newElm({
            classes: ['flowlist']
        });
        ['2D', 'SS_LR', 'SS_RL', 'TB_LR', 'TB_RL'].forEach(ssType => {
            const listItem = this.newElm({
                classes: ['flowlist-item'],
                textContent: ssType
            });
            window.threeDTypeDropdownList.appendChild(listItem);
        });
        document.body.appendChild(window.threeDTypeDropdownList);
    }

    attachThreeDTypeDropDownList(handler) {
        window.threeDTypeDropdownList.querySelectorAll('.flowlist-item').forEach(item => item.onclick = handler);
    }


}

export default new Util();