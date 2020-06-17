'use strict';

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ muteAll: false });
    chrome.storage.sync.set({ muteUsers: false });
    chrome.storage.sync.set({ joined: false });

    chrome.declarativeContent.onPageChanged.removeRules(undefined,  () => {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: {
                    hostEquals: 'meet.google.com'
                },
            })],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});


