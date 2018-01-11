chrome.runtime.onMessage.addListener((msg, sender, res) => {
    if (msg.request) {
        chrome.desktopCapture.chooseDesktopMedia([msg.type], streamId => {
            chrome.tabs.sendMessage(sender.tab.id, { streamId, type: msg.type });
        });
    }
});
