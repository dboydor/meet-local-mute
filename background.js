'use strict';

chrome.runtime.onInstalled.addListener(() => {
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


