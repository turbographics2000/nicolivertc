chrome.runtime.onMessage.addListener((message, sender, response) => {
    if(message === 'installCheck') {
        response(true);
    } else if(message) {
        chrome.desktopCapture.chooseDesktopMedia(message, sender.tab, streamId => {
            response(streamId);
        });
        return true;
    }
});