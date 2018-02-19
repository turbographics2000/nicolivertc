import { PlaneBufferGeometry, Texture, VideoTexture, MeshBasicMaterial, Mesh } from '../lib/three.module.js';

class Util {
    constructor() {
        this.setupSourceList();
        this.extensionId = 'ihafcmmhcoebpkpddkfpopiojljicggi';
        this.audioContext = new AudioContext();
        this.createThreeDTypeDropdownList();

        window.addEventListener('click', evt => {
            document.querySelectorAll('.flowlist').forEach(elm => elm.classList.remove('show'));
        }, true);
    }

    setupSourceList() {
        this.setupTab(document.querySelector('#inputList'));
        this.setupTab(document.querySelector('.capture-device-list'));
        this.setupTab(document.querySelector('.media-list'));
        inputList.style.display = '';
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

    newElm({
        tagName = 'div',
        type,
        classes,
        attributes,
        styles,
        dataset,
        textContent,
        title,
        alt,
        value,
        selected,
        draggable,
        onclick,
        onmousedown,
        onmousemove,
        onmouseup,
        onload,
        ondragstart,
        ondragend,
        children
    }) {
        const elm = document.createElement(tagName);
        if (type) elm.type = type;
        if (classes) {
            if (!Array.isArray(classes)) classes = [classes];
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
        if (title) elm.title = title;
        if (alt) elm.alt = alt;
        if (type) elm.type = type;
        if (value) elm.value = value;
        if (selected) elm.selected = true;
        if (draggable) elm.draggable = true;
        if (onclick) elm.onclick = onclick;
        if (onmousedown) elm.onmousedown = onmousedown;
        if (onmousemove) elm.onmousemove = onmousemove;
        if (onmouseup) elm.onmouseup = onmouseup;
        if (onload) elm.onload = onload;
        if (ondragstart) elm.ondragstart = ondragstart;
        if (ondragend) elm.ondragend = ondragend;
        if (children) {
            if (!Array.isArray(children)) children = [children];
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

    generateUnusedValue(name, list, propertyName = 'name') {
        for (let n = 1; n <= 100; n++) {
            let value = null;
            value = `${n === 1 ? '' : `(${n}) `}${name}`;
            if (!list.filter(item => item[propertyName] === value).length) {
                return value;
            }
        }
    }

    async getDevices(filter) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => {
            return device.kind === filter &&
                (filter !== 'audioinput' || !['default', 'communications'].includes(device.deviceId))
        });
    }

    async getStream(mediaType, streamType, name, deviceId, data) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ [streamType]: { deviceId } });
            let target = null;
            let item = {
                id: deviceId,
                deviceId,
                name,
                mediaType,
                connecting: true
            };
            if (stream.getVideoTracks().length) {
                target = await (_ => {
                    return new Promise((resolve, reject) => {
                        const video = document.createElement('video');
                        video.autoplay = true;
                        video.onloadedmetadata = evt => {
                            resolve(video);
                        }
                        video.onerror = evt => {
                            reject(evt);
                        };
                        video.srcObject = stream;
                        item.visibility = true;
                        item.locked = false;
                        item.target = video;
                        item.width = video.videoWidth;
                        item.height = video.videoHeight;
                        item.aspectRatio = video.videoWidth / video.videoHeight;
                    });
                })();
            } else if (stream.getAudioTracks().length) {
                const analyser = this.audioContext.createAnalyser();
                analyser.fftSize = 256;
                const bufferLength = analyser.frequencyBinCount;
                const data = new Uint8Array(bufferLength);
                const source = this.audioContext.createMediaStreamSource(stream);
                const gainNode = this.audioContext.createGain();
                item.target = null;
                item.analyser = analyser;
                item.gainNode = gainNode;
                item.bufferLength = bufferLength;
                item.data = data;
                item.source = source;
                item.width = 0;
                item.height = 0;
                Object.defineProperty(item, 'volume', {
                    get: function () {
                        return this.gainNode.gain.value * 100 | 0;
                    },
                    set: function (value) {
                        this.gainNode.gain.value = value / 100;
                    }
                });
                item.visibility = false;
                item.locked = true;
                source.connect(gainNode);
                gainNode.connect(analyser);
            } else {
                throw new Error('getStream error');
            }
            data.add(mediaType, item);
        } catch (err) {
            console.log(err);
        }
    }

    imageLoad(file) {
        return new Promise((resolve, reject) => {
            var src = URL.createObjectURL(file);
            var img = new Image();
            img.onload = evt => {
                resolve({
                    target: img,
                    mediaType: 'image'
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
                    target: audio,
                    mediaType: 'audio'
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
            const src = URL.createObjectURL(file);
            let video = document.createElement('video');
            video.onloadedmetadata = evt => {
                if (!video.videoWidth && !video.videoHieght) {
                    video = null;
                    const audio = new Audio();
                    audio.onloadeddata = evt => {
                        resolve({
                            target: audio,
                            mediaType: 'audio'
                        });
                    };
                    audio.onerror = evt => {
                        reject(evt);
                    };
                    audio.src = src;
                } else {
                    resolve({
                        target: video,
                        mediaType: 'video'
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
        const ab = await this.blobToArrayBuffer(file, 64);
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
        else type = 'other';
        return type;
    }

    blobToArrayBuffer(blob, size) {
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = evt => {
                resolve(fr.result);
            };
            fr.onerror = evt => {
                reject(evt);
            };
            let b = size ? blob.slice(0, Math.min(size, blob.size)) : blob;
            fr.readAsArrayBuffer(b);
        });
    };

    async generateWaveformImage(file, w, h, color = '#d0782a', s = 4) {
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
                    min *= s;
                    max *= s;
                    if (max > 1.0) {
                        if (s === 1) {
                            s = 0.5;
                        } else {
                            s = Math.floor(max) / 2;
                        }
                        return await this.generateWaveformImage(file, w, h, color, s);
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
            classes: ['flowlist', 'theme-color-d1']
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


    createWebGLObj(target, mediaType) {
        const geometry = new PlaneBufferGeometry(1, 1, 32, 32);
        geometry.scale.set(item.width, item.height, 1);
        let texture = null;
        if (mediaType === 'image') {
            texture = new Texture(target);
        } else {
            texture = new VideoTexture(target);
        }
        const material = new MeshBasicMaterial({ map: texture });
        const mesh = new Mesh(geometry, material);
        return {
            geometry,
            texture,
            material,
            mesh
        };
    }

    disposeWebGLObj(webGLObj) {

    }
}

export default new Util();