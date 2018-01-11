window.addEventListener('request', evt => {
    chrome.runtime.sendMessage({ request: true, type: evt.detail });
});

chrome.runtime.onMessage.addListener(msg => {
    if (msg.streamId) {
        const evt = new CustomEvent('desktopStreamId', { detail: msg.streamId });
        window.dispatchEvent(evt);
    }
});

