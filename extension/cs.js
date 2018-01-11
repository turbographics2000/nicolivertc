var apiKey = 'ce16d9aa-4119-4097-a8a5-3a5016c6a81c';
var extId = '';
var leoPlayerProps = null;
var peer = null;
var myId = null;

chrome.runtime.onMessageExternal.addListener((msg, sender, res) => {
    if (sender.id === extId) {
        leoPlayerProps = msg;
        myId = `${leoPlayerProps.broadcastId}_${leoPlayerProps.userStatus.id}`;
        uiSetup();
    }
});

var injectCode = '(' + function () {
    chrome = browser || chrome;
    var rafId = null;
    (function waitLeoPlayerProps() {
        if (leoPlayerProps) {
            fetch('http://watch.live.nicovideo.jp/api/getplayerstatus/lv301233591', { credentials: 'include' })
                .then(res => res.text())
                .then(text => {
                    var elm = (new DOMParser())
                        .parseFromString(text, 'text/html')
                        .querySelector('owner_id');
                    if (elm) {
                        leoPlayerProps.rootId = elm.textContent;
                        chrome.runtime(extId, leoPlayerProps);
                    } else {
                        setTimeout(waitLeoPlayerProps, 3000);
                    }
                });
        }
    })();
} + ')()';
var script = document.createElement('script');
script.text = injectCode;
document.body.appendChild(script);

var btnStart = documen.querySelector('.btn-broadcast-start');
btnStart.onclick = evt => {
    if (window.chrome) {
        chrome.runtime.sendMessage('gmmpnajlmiejobjejmahldpgmcpfpnin', { screenShare: true }, ({ streamId }) => {
            if (streamId) {
                navigator.mediaDevices.getUserMedia({
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: streamId
                        }
                    }
                }).then(stream => {
                    vid.srcObject = stream;
                });
            }
        });
    } else if (typeof InstallTrigger !== 'undefined') {
        navigator.mediaDevices.getUserMedia({
            video: {
                mediaSource: 'screen' // 'window', 'application'
            },
        }).then(stream => {
            vid.srcObject = stream;
        });
    }
};


function uiSetup() {
    <div class="user-ad-action"><div class="btn-disabled"><span class="btn-text">ニコニ広告で宣伝</span></div></div>
    var btnStart = document.createElement('div');
    btnStart.classList.add('user-add-action');
    btnStart.classList.add('ext-button');
    btnStart.style.display = 'inline-block';
    btnStart.style.float = 'right';
    btnStart.style.height = '100%';
    btnStart.textContent = 'WebRTC放送開始';
    btnStart.onclick = _ => {
        if (btnStart.textContent === 'WebRTC放送開始') {
            btnStart.textContent = 'WebRTC放送中止';
            peer = new Peer(leoPlayerProps.userStatus.id, { key: apiKey, debug: 3 });
            peerInstanceExtend({
                peer,
                rootId: leoPlayerProps.rootId,
                branchCount: 2,
                getStream: 'testpattern_time',
                previewElement: selfView
            });
            peer.on('open', _ => {
            });
            peer.on('id_taken', _ => {
                console.log('他のタブ(ウィンドウ)ですでに同じ放送を視聴しているため、このタブ(ウィンドウ)で視聴することができません。');
            });
        }
    }

    var viewArea = document.querySelector('.user-ad-view-area');
    viewArea.appendChild(btnStart);
    document.body.appendChild(btnStart);
}

// var timeElm = null;
// function timeWatch() {
//     if (!timeElm) {
//         timeElm = document.querySelector('span[class^="___time-display"]');
//     }
//     if(/^(?:(?:(\d+):)?([0-5]?\d):)?([0-5]?\d)\/(?:(?:(\d+):)?([0-5]?\d):)?([0-5]?\d)$/.test(timeElm.textContent)) {
//         var res = /^(?:(?:(\d+):)?([0-5]?\d):)?([0-5]?\d)\/(?:(?:(\d+):)?([0-5]?\d):)?([0-5]?\d)$/.exec(timeElm.textContent);
//         var elapsedH = +(res[1] || '0');
//         var elapsedM = +(res[2] || '0');
//         var elapsedS = +(res[3] || '0');
//         var endH = +(res[4] || '0');
//         var endM = +(res[5] || '0');
//         var endS = +(res[6] || '0');
//         var elapsedTotalSeconds = (elapsedH * 60 * 60) + (elapsedM * 60) + elapsedS;
//         var endTotalSeconds = (endH * 60 * 60) + (endM * 60) + endS;
//         if(elapsedTotalSeconds > endTotalSeconds) {
//             console.log('[warning] time parse. elapsed > end');
//         } else if(endTotalSeconds - elapsedTotalSeconds <= 1) {
//             peer.notifyEnd();
//         }
//     }
//     if(!timeElm || !timeElm.textContent.includes('/')) return;
//     var splTime = timeElm.textContent.includes('/')[1];
// }

