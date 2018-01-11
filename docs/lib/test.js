import { VideoPlayer } from './VideoPlayer.js';

const player = new VideoPlayer();
playerContainer.appendChild(player.domElement);

window.addEventListener('keydown', evt => {
    switch (evt.code) {
        case 'Digit1':
            player.setSrc('LR.mp4', VideoPlayer.SBS_LR, false, true, true);
            break;
        case 'Digit2':
            player.setSrc('RL.mp4', VideoPlayer.SBS_RL, false, true, true);
            break;
        case 'Digit3':
            player.setSrc('TAB_LR.mp4', VideoPlayer.TAB_LR, false, true, true);
            break;
        case 'Digit4':
            player.setSrc('TAB_RL.mp4', VideoPlayer.TAB_RL, false, true, true);
            break;
        case 'Digit5':
            player.setSrc('360TAB_LR.mp4', VideoPlayer.TAB_LR, true, true, true);
            break;
    }
});


// let renderer = null;
// let scene = null;
// let texture = null;
// let camera = null;
// const renderingTypes = ['normal', 'anaglyph'];
// let renderingTypeIndex = 0;
// let width = window.innerWidth;
// let height = window.innerHeight;
// let halfWidth = width / 2;
// let anaglyphEffect = null;
// let stereoEffect = null;
// let vrEffect = null;
// let vrControls = null;
// let isVRPresenting = false;

// window.onkeydown = evt => {
//     if(evt.code === 'KeyS') {
//         renderingTypeIndex = (renderingTypeIndex + 1) % 2;
//         onResize();
//     } else if(evt.code === 'KeyF') {
//         isVRPresenting = !isVRPresenting;
//         vrEffect.setFullScreen(isVRPresenting);
//     }
// };

// function setup(video) {
//     const width = video.videoWidth;
//     const height = video.videoHeight;
//     renderer = new THREE.WebGLRenderer({});
//     //stereoEffect = new THREE.StereoEffect(renderer);
//     //stereoEffect.setSize(width, height);
//     renderer.domElement.style.display = 'inherit';
//     document.body.appendChild(renderer.domElement);
//     scene = new THREE.Scene();
//     camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 10000);
//     camera.position.z = height / 2;
//     vrControls = new THREE.VRControls(camera);
//     vrEffect   = new THREE.VREffect(renderer, vrEffectError, this.beforeRenderL, this.beforeRenderR);
//     //const geometry = new THREE.SphereBufferGeometry(100, 32, 32);
//     const geometry = new THREE.PlaneBufferGeometry(width, height);
//     texture = new THREE.VideoTexture(video);
//     texture.minFilter = THREE.LinearFilter;
//     texture.magFilter = THREE.LinearFilter;
//     texture.format = THREE.RGBFormat;
//     //texture.repeat.y = 0.5;
//     anaglyphEffect = new THREE.AnaglyphEffect(renderer, null, null, false, this.beforeRenderL, this.beforeRenderR);
//     anaglyphEffect.setSize(width, height);
//     const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
//     const mesh = new THREE.Mesh(geometry, material);
//     scene.add(mesh);
//     render();
// }

// function vrEffectError(err) {
//     console.log(err);
// }

// function beforeRenderL() {
//     texture.offset.y = 0;

// }

// function beforeRenderR() {
//     texture.offset.y = 0.5;
// }

// function render() {
//     requestAnimationFrame(render);
//     vrControls.update();
//     if(isVRPresenting) {
//         vrEffect.render(scene, camera);
//     } else {
//         switch(renderingTypes[renderingTypeIndex]) {
//             case 'normal':
//                 renderer.render(scene, camera);
//                 break;
//             case 'stereo':
//                 stereoEffect.render(scene, camera);
//                 break;
//             case 'anaglyph':
//                 anaglyphEffect.render(scene, camera, texture);
//                 break;
//         }
//     }
// }

// window.addEventListener('resize', onResize);
// function onResize(evt) {
//     camera.aspect = window.innerWidth / window.innerHeight;
//     camera.updateProjectionMatrix();
//     //stereoEffect.setSize(window.innerWidth, window.innerHeight);
//     anaglyphEffect.setSize(window.innerWidth, window.innerHeight);
// }

