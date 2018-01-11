import { EventEmitter } from "./EventEmitter.js";


export class VideoPlayer extends EventEmitter {
    constructor() {
        super();
        this.renderingTypes = ['normal', 'anaglyph'];
        this.renderingTypeIndex = 0;
        this.width = 1;
        this.height = 1;
        this.halfWidth = this.width / 2;
        this.anaglyphEffect = null;
        this.stereoEffect = null;
        this.vrEffect = null;
        this.vrControls = null;
        this.isVRPresenting = false;
        this.is360 = false;
        this.isStereo = false;

        window.addEventListener('keydown', evt => {
            if (evt.code === 'KeyS') {
                this.renderingTypeIndex = (this.renderingTypeIndex + 1) % 2;
                this.onResize();
            } else if (evt.code === 'KeyF') {
                this.isVRPresenting = !this.isVRPresenting;
                this.vrEffect.setFullScreen(this.isVRPresenting).catch(err => {
                    console.log(err);
                })
            }
        });
        window.addEventListener('resize', this.onResize.bind(this));

        this.renderer = new THREE.WebGLRenderer({});
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 10000);
        this.vrControls = new THREE.VRControls(this.camera);
        this.vrEffect = new THREE.VREffect(this.renderer, this.vrEffectError, this.beforeRenderL.bind(this), this.beforeRenderR.bind(this));
        this.anaglyphEffect = new THREE.AnaglyphEffect(this.renderer, false, this.beforeRenderL.bind(this), this.beforeRenderR.bind(this));
    }

    static get NORMAL() {
        return 0;
    }
    static get SBS_LR() {
        return 1;
    }
    static get SBS_RL() {
        return 2;
    }
    static get TAB_LR() {
        return 3;
    }
    static get TAB_RL() {
        return 4;
    }


    vrEffectError(err) {
        console.log(err);
    }

    beforeRenderL() {
        switch (this.videoType) {
            case VideoPlayer.SBS_LR:
                this.texture.offset.x = 0;
                break;
            case VideoPlayer.SBS_RL:
                this.texture.offset.x = 0.5;
                break;
            case VideoPlayer.TAB_LR:
                this.texture.offset.y = 0;
                break;
            case VideoPlayer.TAB_RL:
                this.texture.offset.y = 0.5;
                break;
        }
    }

    beforeRenderR() {
        switch (this.videoType) {
            case VideoPlayer.SBS_LR:
                this.texture.offset.x = 0.5;
                break;
            case VideoPlayer.SBS_RL:
                this.texture.offset.x = 0;
                break;
            case VideoPlayer.TAB_LR:
                this.texture.offset.y = 0.5;
                break;
            case VideoPlayer.TAB_RL:
                this.texture.offset.y = 0;
                break;
        }
    }

    render() {
        this.renderingRafId = requestAnimationFrame(this.render.bind(this));
        if(this.is360) this.vrControls.update();
        if (this.isVRPresenting) {
            this.vrEffect.render(this.scene, this.camera);
        } else {
            switch (this.renderingTypes[this.renderingTypeIndex]) {
                case 'normal':
                    this.renderer.render(this.scene, this.camera);
                    break;
                case 'anaglyph':
                    this.anaglyphEffect.render(this.scene, this.camera);
                    break;
            }
        }
    }

    stopRender() {
        if (this.renderingRafId) {
            cancelAnimationFrame(this.renderingRafId);
            this.renderingRafId = null;
        }
    }

    onResize(evt) {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        if (this.videoType === VideoPlayer.NORMAL) {
            this.renderer.setSize(this.width, this.height);
        } else {
            this.anaglyphEffect.setSize(this.width, this.height);
            this.vrEffect.setSize(this.width, this.height);
        }
    }

    setSrc(src, videoType = this.NORMAL, is360 = false, isAutoPlay = false, isMuted = false) {
        const video = document.createElement('video');
        video.onloadedmetadata = evt => {
            this.setVideo(video, videoType, is360);
            video.muted = isMuted;
            if(isAutoPlay) video.play();
        }
        video.src = src;
    }

    setVideo(video, videoType = VideoPlayer.NORMAL, is360 = false) {
        if (!video) return;
        this.renderer.renderLists.dispose();
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.scene.remove(this.mesh);
            this.mesh = null;
        }

        this.video = video;
        this.width = video.videoWidth;
        this.height = video.videoHeight;
        const texture = new THREE.VideoTexture(video);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBFormat;
        this.texture = texture;
        this.videoType = videoType;
        this.is360 = is360;
        if (this.videoType === VideoPlayer.NORMAL) {
            this.texture.repeat.x = this.texture.repeat.y = 1;
        } else if (this.videoType <= VideoPlayer.SBS_RL) {
            if(!this.is360) this.width /= 2;
            this.texture.repeat.x = 0.5;
        } else if (this.videoType <= VideoPlayer.TAB_RL) {
            if(!this.is360) this.height /= 2;
            this.texture.repeat.y = 0.5;
        }
        if (this.is360) {
            this.geometry = new THREE.SphereBufferGeometry(100, 64, 64);
            this.material = new THREE.MeshBasicMaterial({ map: this.texture, side: THREE.DoubleSide });
        } else {
            this.geometry = new THREE.PlaneBufferGeometry(this.width, this.height);
            this.material = new THREE.MeshBasicMaterial({ map: this.texture });
        }
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);
        this.camera.fov = this.is360 ? 75 : 90;
        this.camera.position.z = this.is360 ? 0 : this.height / 2;
        this.onResize();
        if (!this.renderingRafId) this.render();
    }

    get autoPlay() {
        return this.video ? this.video.autoPlay : null;
    }

    set autoPlay(value) {
        if(this.video) this.video.autoPlay = value;
    }

    get currentTime() {
        return this.video ? this.video.currentTime : null;
    }

    set currentTime(value) {
        if (this.video) this.video.currentTime = value;
    }

    get duration() {
        return this.video ? this.video.duraiton : null;
    }

    get domElement() {
        return this.renderer ? this.renderer.domElement : null;
    }

    get ended() {
        return this.video ? this.video.ended : null;
    }

    get error() { // TODO
        return this.video ? this.video.error : null;
    }

    get loop() {
        return this.video ? this.video.loop : null;
    }

    set loop(value) {
        if (this.video) this.video.loop = value;
    }

    get muted() {
        return this.video ? this.video.muted : null;
    }

    set muted(value) {
        if (this.video) this.video.muted = value;
    }

    get paused() {
        return this.video ? this.video.paused : null;
    }

    get playbackRate() {
        return this.video ? this.video.playbackRate : null;
    }

    set playbackRate(value) {
        if (this.video) this.video.playbackRate = value;
    }

    get played() {
        return this.video ? this.video.played : null;
    }

    get preload() {
        return this.video ? this.video.preload : null;
    }

    set preload(value) {
        if (this.video) this.video.preload = value;
    }

    get readyState() {
        return this.video ? this.video.readyState : null;
    }

    get seekable() {
        return this.video ? this.video.seekable : null;
    }

    get seeking() {
        return this.video ? this.video.seeking : null;
    }

    get src() {
        return this.video ? this.video.src : null;
    }

    // set src(value) {} // setterではなくメソッド(setSrc)にする。(videoType, is360, isStereoもセットできるようにするため)

    get volume() {
        return this.video ? this.video.volume : null;
    }

    set volume(value) {
        if (this.video) this.video.volume = value;
    }

    play() {
        if (this.video) this.video.play();
    }

    pause() {
        if (this.video) this.video.pause();
    }


}
