import { EventEmitter } from '../base/EventEmitter.js';
import { DialogController } from '../base/DialogController.js';
import util from '../base/util.js';
import WebOBSData from '../base/WebOBSData.js';

export class LayoutController extends EventEmitter {
    constructor(options) {
        super();

        this.data = options.data;
        this.bkCnv = bkCnv;
        this.cnv = cnv;
        this.bbCnv = bbCnv;
        this.bkCtx = this.bkCnv.getContext('2d');
        this.bkCtxFillStyle = document.defaultView.getComputedStyle(themeColorL1).backgroundColor;
        this.ctx = this.cnv.getContext('2d');
        this.bbCtx = this.bbCnv.getContext('2d');
        this.scale = 1;
        this.hhs = 0;
        this.hs = 0;
        this.handleSize = 10;
        this.draggingTarget = null;
        this.sPos = null;
        this.cameraListView = options.cameraListView;
        this.micListView = options.micListView;
        this.desktopListView = options.desktopListView;
        this.audioListView = options.audioListView;
        this.videoListView = options.videoListView;
        this.imageListView = options.imageListView;
        this.sceneListView = options.sceneListView;
        this.sourceListView = options.sourceListView;
        this.sourceListView.on('sceneChanged', this.redraw.bind(this));
        this.sourceListView.on('selectedIndexChanged', _ => this.bbCtxRender());
        this.transition = transitionSelect.value;
        this.transitionTime = 0;
        this.transitionEndTime = 0;

        this.NW_CURSOR = 'nw-resize';
        this.N_CURSOR = 'n-resize';
        this.NE_CURSOR = 'ne-resize';
        this.W_CURSOR = 'w-resize';
        this.E_CURSOR = 'e-resize';
        this.SW_CURSOR = 'sw-resize';
        this.S_CURSOR = 's-resize';
        this.SE_CURSOR = 'se-resize';
        this.MOVE_CURSOR = 'move';
        this.DEFAULT_CURSOR = 'default';

        this.cnvSize = {
            width: 1280,
            height: 720,
            aspectRatio: 1280 / 720
        };
        this.cnv.width = this.cnvSize.width;
        this.cnv.height = this.cnvSize.height;


        this.bbCnv.ondragover = this.onDragOver.bind(this);
        this.bbCnv.ondrop = this.onDrop.bind(this);
        this.bbCnv.onmousedown = this.onMouseDown.bind(this);
        this.bbCnv.onmousemove = this.onMouseMove.bind(this);
        this.bbCnv.onmouseup = this.onMouseUp.bind(this);
        window.onresize = this.onResize.bind(this);
        setTimeout(() => {
            this.onResize();
            this.cnv.style.display = '';
        }, 0);

        this.onResize();
        this.ctxRender();

        WebOBSData.on('selected scene changed', this.onSceneChanged.bind(this));
        WebOBSData.on('selected source changed', this.bbCtxRender.bind(this));
        WebOBSData.on('propertyChanged', this.bbCtxRender.bind(this));
    }

    get scene() {
        return WebOBSData.getSelectedItem('scene');
    }

    get items() {
        return WebOBSData.getItems('source');
    }

    get selectedItem() {
        let item = WebOBSData.getSelectedItem('source');
        if (item && item.locked) item = null;
        return item;
    }

    get cnvLeft() {
        return parseInt(this.cnv.style.left) / this.scale;
    }

    get cnvTop() {
        return parseInt(this.cnv.style.top) / this.scale;
    }

    onSceneChanged({ oldItem }) {
        this.oldItems = oldItem.items;
        this.transitionTime = WebOBSData.transitionTime;
        this.transitionEndTime = Date.now() + this.transitionTime;
        this.bbCtxRender();
        this.bkCtxRender();
    }

    onDragOver(evt) {
        evt.preventDefault();
    }

    async onDrop(evt) {
        try {
            evt.preventDefault();
            const pos = this.convToReal(evt);
            const addObj = (item) => {
                const halfWidth = item.width ? item.width / 2 : 0;
                const halfHeight = item.height ? item.height / 2 : 0;
                item = Object.assign(item, {
                    visibility: true,
                    locked: false,
                    cx: pos.x,
                    cy: pos.y,
                    left: pos.x - halfWidth,
                    top: pos.y - halfHeight,
                    right: pos.x + halfWidth,
                    bottom: pos.y + halfHeight,
                    aspectRatio: item.width ? item.width / item.height : 0,
                    degree360: false,
                    threeDType: '2D'
                });
                if (WebOBSData.getSelectedItem('scene').special) {
                    if (this.cnvSize.aspectRatio < item.aspectRatio) {
                        item.height = this.cnvSize.width / item.aspectRatio;
                        item.width = this.cnvSize.width;
                    } else {
                        item.width = this.cnvSize.height * item.aspectRatio;
                        item.height = this.cnvSize.height;
                    }
                    item = Object.assign(item, {
                        locked: true,
                        left: (this.cnvSize.width - item.width) / 2,
                        top: (this.cnvSize.height - item.height) / 2,
                        right: this.cnvSize.width - 1,
                        bottom: this.cnvSize.height - 1,
                        cx: this.cnvSize.width / 2,
                        cy: this.cnvSize.height / 2,
                        aspectRatio: this.cnvSize.aspectRatio
                    });
                }
                WebOBSData.add(item.mediaType, item, true);
                this.bbCtxRender();
            };
            if (evt.dataTransfer.files.length) {
                await [...evt.dataTransfer.files].forEach(async file => {
                    try {
                        const type = await util.parseMediaFileType(file);
                        let item = null;
                        if (['png', 'jpg'].includes(type)) item = await util.imageLoad(file);
                        if (['wav', 'mp3', 'flac'].includes(type)) item = await util.audioLoad(file);
                        if (['ogg', 'webm', 'mp4'].includes(type)) item = await util.videoLoad(file);
                        item.width = item.target.videoWidth || item.target.naturalWidth || 0;
                        item.height = item.target.videoHeight || item.target.naturalHeight || 0;
                        item.id = util.generateUUID();
                        item.name = util.generateUnusedValue(file.name, WebOBSData.getItems(item.mediaType));
                        if (item.mediaType === 'audio') {
                            item.waveformImage = await util.generateWaveformImage(file, 240, 105);
                            item.waveformThumb = await util.generateWaveformImage(file, 240, 30);
                        }
                        addObj(item);
                    } catch (err) {
                        console.log(err);
                    }
                });
                this.bbCtxRender();
            } else {
                const target = this.cameraListView.draggingTarget ||
                    this.micListView.draggingTarget ||
                    this.desktopListView.draggingTarget ||
                    this.audioListView.draggingTarget ||
                    this.videoListView.draggingTarget ||
                    this.imageListView.draggingTarget;
                addObj(target);
            }
        } catch (e) {
            console.log(e);
        }
    }

    onMouseDown(evt) {
        this.sPos = this.convToReal(evt);

        const selectedItem = this.hitTest(this.sPos);
        if (selectedItem) {
            WebOBSData.setSelectedItem('source', selectedItem);
        }
        this.bbCtxRender();
    };

    onMouseMove(evt) {
        const pos = this.convToReal(evt);
        const cursor = this.bbCnv.style.cursor;
        if (!this.sPos) {
            this.hitTest(pos);
            return;
        }

        if (!this.selectedItem) return;

        if (cursor === this.N_CURSOR || cursor === this.S_CURSOR) {
            if (cursor === this.N_CURSOR) {
                this.selectedItem.bottom -= pos.y - this.selectedItem.top;
                this.selectedItem.top = pos.y;
            } else {
                this.selectedItem.top -= pos.y - this.selectedItem.bottom;
                this.selectedItem.bottom = pos.y;
            }
            const h = this.selectedItem.bottom - this.selectedItem.top;
            const w = this.selectedItem.aspectRatio * h;
            this.selectedItem.left = this.selectedItem.cx - w / 2;
            this.selectedItem.right = this.selectedItem.cx + w / 2;
            this.selectedItem.width = w;
            this.selectedItem.height = h;
            this.bbCtxRender();
            return;
        }

        if (cursor === this.MOVE_CURSOR) {
            const difX = pos.x - this.sPos.x;
            const difY = pos.y - this.sPos.y;
            this.selectedItem.left += difX;
            this.selectedItem.cx += difX;
            this.selectedItem.right += difX;
            this.selectedItem.top += difY;
            this.selectedItem.cy += difY;
            this.selectedItem.bottom += difY;
            this.sPos = pos;
        }
        if (cursor === this.NW_CURSOR ||
            cursor === this.W_CURSOR ||
            cursor === this.SW_CURSOR) {
            this.selectedItem.left = pos.x;
            this.selectedItem.right = this.selectedItem.cx + (this.selectedItem.cx - pos.x);
        }
        if (cursor === this.NE_CURSOR ||
            cursor === this.E_CURSOR ||
            cursor === this.SE_CURSOR ||
            cursor === this.DEFAULT_CURSOR) {
            this.selectedItem.right = pos.x;
            this.selectedItem.left = this.selectedItem.cx - (pos.x - this.selectedItem.cx);
        }
        this.selectedItem.width = this.selectedItem.right - this.selectedItem.left;

        const h = this.selectedItem.width / this.selectedItem.aspectRatio;
        this.selectedItem.top = this.selectedItem.cy - h / 2;
        this.selectedItem.bottom = this.selectedItem.cy + h / 2;
        this.selectedItem.height = this.selectedItem.bottom - this.selectedItem.top;

        this.bbCtxRender();
    };

    onMouseUp(evt) {
        this.sPos = null;
    }

    onResize(evt) {
        const layoutAreaPadding = 10;
        const layoutWrapRect = layoutWrap.getBoundingClientRect();
        const layoutWrapWidth = layoutWrapRect.width - (layoutAreaPadding * 2);
        const layoutWrapHeight = layoutWrapRect.height - (layoutAreaPadding * 2);
        const layoutAreaAspectRatio = layoutWrapWidth / layoutWrapHeight;
        let cnvWidth = 0;
        let cnvHeight = 0;
        if (this.cnvSize.aspectRatio > layoutAreaAspectRatio) {
            cnvWidth = layoutWrapWidth;
            cnvHeight = cnvWidth / this.cnvSize.aspectRatio;
        } else {
            cnvHeight = layoutWrapHeight;
            cnvWidth = cnvHeight * this.cnvSize.aspectRatio;
        }

        this.scale = cnvWidth / this.cnvSize.width;
        this.hhs = ((this.handleSize - 1) / 2) / this.scale;
        this.hs = this.handleSize / this.scale;
        this.bkCnv.width = this.bbCnv.width = layoutWrapRect.width / this.scale;
        this.bkCnv.height = this.bbCnv.height = layoutWrapRect.height / this.scale;
        this.cnv.style.left = `${(layoutWrapRect.width - cnvWidth) / 2}px`;
        this.cnv.style.top = `${(layoutWrapRect.height - cnvHeight) / 2}px`;
        this.cnv.style.width = `${cnvWidth}px`;
        this.cnv.style.height = `${cnvHeight}px`;
        this.bbCtxRender();
    }

    redraw(arg) {
        // TODO トランジションをスタックさせるか？
        if (arg && transitionTime.value) {
            this.transitionTime = transitionTime.valueAsNumber;
            this.transitionEndTime = Date.now() + transitionTime.valueAsNumber;
            if (data.items[arg.oldIndex] && data.items[arg.oldIndex].items) {
                this.oldItems = data.items[arg.oldIndex].items;
            } else {
                this.oldItems = [];
            }
            this.transition = transitionSelect.value;
        }
        this.bbCtxRender();
    }

    convToReal(evt) {
        return {
            x: evt.offsetX / this.scale - this.cnvLeft,
            y: evt.offsetY / this.scale - this.cnvTop
        };
    }

    hitTestHandle(testPos, px, py) {
        return px - this.hhs < testPos.x &&
            px + this.hhs > testPos.x &&
            py - this.hhs < testPos.y &&
            py + this.hhs > testPos.y;
    }

    hitTest(testPos) {
        let s = this.bbCnv.style;
        s.cursor = this.DEFAULT_CURSOR;
        if (this.selectedItem) {
            const cx = this.selectedItem.left + this.selectedItem.width / 2;
            const cy = this.selectedItem.top + this.selectedItem.height / 2;
            if (this.hitTestHandle(testPos, this.selectedItem.left, this.selectedItem.top)) s.cursor = this.NW_CURSOR;
            if (this.hitTestHandle(testPos, cx, this.selectedItem.top)) s.cursor = this.N_CURSOR;
            if (this.hitTestHandle(testPos, this.selectedItem.right, this.selectedItem.top)) s.cursor = this.NE_CURSOR;
            if (this.hitTestHandle(testPos, this.selectedItem.left, cy)) s.cursor = this.W_CURSOR;
            if (this.hitTestHandle(testPos, this.selectedItem.right, cy)) s.cursor = this.E_CURSOR;
            if (this.hitTestHandle(testPos, this.selectedItem.left, this.selectedItem.bottom)) s.cursor = this.SW_CURSOR;
            if (this.hitTestHandle(testPos, cx, this.selectedItem.bottom)) s.cursor = this.S_CURSOR;
            if (this.hitTestHandle(testPos, this.selectedItem.right, this.selectedItem.bottom)) s.cursor = this.SE_CURSOR;
            if (s.cursor !== this.DEFAULT_CURSOR) return this.selectedItem;
        }

        if (!this.items) return null;
        for (let i = this.items.length; i--;) {
            const obj = this.items[i];
            if (obj.locked) continue;
            let left = obj.left;
            let right = obj.right;
            let top = obj.top;
            let bottom = obj.bottom;
            if (obj.left > obj.right)[left, right] = [obj.right, obj.left];
            if (obj.top > obj.bottom)[top, bottom] = [obj.bottom, obj.top];
            if (left < testPos.x && right > testPos.x && top < testPos.y && bottom > testPos.y) {
                this.bbCnv.style.cursor = this.MOVE_CURSOR;
                return obj;
            }
        }
        return null;
    }

    bbCtxRender() {
        const item = this.selectedItem;
        this.bbCtx.clearRect(0, 0, this.bbCnv.width, this.bbCnv.height);
        this.bkCtxRender();
        if (!item || item.locked || item.mediaType === 'audio' || item.mediaType === 'mic') return;
        this.bbCtx.lineWidth = 2 / this.scale;
        this.bbCtx.strokeStyle = 'red';
        const l = item.left + this.cnvLeft;
        const t = item.top + this.cnvTop;
        const r = l + item.width;
        const b = t + item.height;
        const cx = l + item.width / 2;
        const cy = t + item.height / 2;
        this.bbCtx.strokeRect(l - this.hhs, t - this.hhs, this.hs, this.hs);
        this.bbCtx.strokeRect(cx - this.hhs, t - this.hhs, this.hs, this.hs);
        this.bbCtx.strokeRect(r - this.hhs, t - this.hhs, this.hs, this.hs);
        this.bbCtx.strokeRect(l - this.hhs, cy - this.hhs, this.hs, this.hs);
        this.bbCtx.strokeRect(r - this.hhs, cy - this.hhs, this.hs, this.hs);
        this.bbCtx.strokeRect(l - this.hhs, b - this.hhs, this.hs, this.hs);
        this.bbCtx.strokeRect(cx - this.hhs, b - this.hhs, this.hs, this.hs);
        this.bbCtx.strokeRect(r - this.hhs, b - this.hhs, this.hs, this.hs);
        this.bbCtx.strokeRect(l, t, item.width, item.height);
    }

    bkCtxRender() {
        this.bkCtx.clearRect(0, 0, this.bbCnv.width, this.bbCnv.height);
        if (!this.items) return;
        this.items.forEach(item => {
            this.bkCtx.fillStyle = this.bkCtxFillStyle;//'#ddd';
            this.bkCtx.fillRect(item.left + this.cnvLeft, item.top + this.cnvTop, item.width, item.height);
        });
    }

    ctxRender() {
        requestAnimationFrame(this.ctxRender.bind(this));
        this.ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);
        const duration = Math.max(0, this.transitionEndTime - Date.now());
        const transitionRatio = duration ? duration / this.transitionTime : 0;
        // TODO コールバックでレンダリングさせるか
        switch (WebOBSData.transition) {
            case 'fade':
                if (duration) {
                    this.ctx.globalAlpha = transitionRatio;
                    this.oldItems.forEach(item => {
                        if (item.target && item.width) {
                            this.ctx.drawImage(item.target, item.left, item.top, item.width, item.height);
                        }
                    });
                }
                this.ctx.globalAlpha = 1 - transitionRatio;
                this.items.forEach(item => {
                    if (item.target && item.width) {
                        this.ctx.drawImage(item.target, item.left, item.top, item.width, item.height);
                    }
                });
                break;
            case 'swipe':
                break;
            default:
                if (!this.items) return;
                this.items.forEach(item => {
                    if (item.target && item.width) {
                        if (item.mediaType === 'camera') {
                            if (item.connecting) {
                                this.ctx.drawImage(item.target, item.left, item.top, item.width, item.height);
                            } else {
                                this.ctx.textAlign = 'center';
                                this.ctx.textBaseline = 'middle';
                                this.ctx.fillStyle = 'black';
                                this.ctx.fillRect(item.left, item.top, item.width, item.height);
                                this.ctx.fillStyle = 'white';
                                this.ctx.fillText('接続されていません', item.left + item.width / 2, item.top + item.height / 2);
                            }
                        } else if (['video', 'image', 'text'].includes(item.mediaType)) {
                            if (item.visibility) {
                                this.ctx.drawImage(item.target, item.left, item.top, item.width, item.height);
                            }
                        }
                    }
                });
        }

    }
}