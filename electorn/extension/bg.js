chrome.runtime.onMessageExternal.addListener((msg, sender, res) => {
    chrome.desktopCapture.chooseDesktopMedia([msg.type], sender.tab, streamId => {
        res({ streamId, type: msg.type });
    });
    return true;
});