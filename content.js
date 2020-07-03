let observer
let people
let currentSpeaker
let muted = false
let joined = false

const getUsers = () => {
    return document.querySelectorAll("div[jscontroller] > div[data-self-name]")
}

const goUp = (element, count) => {
    for (let x = 0; x < count; x++) {
        element = element.parentElement
    }

    return element
}

const isSpeaker = (element) => {
    if (element.childElementCount === 3) {
        for (let x = 0; x < 3; x++) {
            const child = element.childNodes[x]
            if (child.childElementCount !== 0 || child.tagName !== "DIV") {
                return false
            }
        }

        return true
    }

    return false
}

const setSpeaker = (person) => {
    currentSpeaker = person
    if (people.some(person2 => person2.trim() === person.trim())) {
        console.log(person, " is speaking, muting audio")
        muteAudio(true)
    } else {
        console.log(person, " is speaking, un-muting audio")
        muteAudio(false)
    }
}

// Callback function to execute when mutations are observed
const watch = (mutationsList, observer) => {
    for (let mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === "class") {
            const target = mutation.target
            if (isSpeaker(target)) {
                const rect = target.getBoundingClientRect()
                if (rect.width !== 0 || rect.height !== 0) {

                    // Person in main screen
                    let parent = target.parentElement
                    if (parent && parent.nextElementSibling) {
                        const sibling = parent.nextElementSibling
                        const person = sibling.textContent
                        if (person.length) {
                            setSpeaker(person)
                        }
                    }

                    // Person in side-bar
                    parent = goUp(target, 4)
                    if (parent &&
                        parent.childNodes.length === 2 &&
                        parent.childNodes[1].childNodes.length === 2) {

                        const child = parent.childNodes[1].childNodes[0]
                        const person = child.textContent
                        if (person.length) {
                            setSpeaker(person)
                        }
                    }
                }
            }
        }
    }
};

const startListening = () => {
    let config = {
        attributes: true,
        subtree: true
    };

    // Create an observer instance linked to the callback function
    observer = new MutationObserver(watch);

    // Start observing the target node for configured mutations
    let node = document.querySelector("[data-unresolved-meeting-id]")
    observer.observe(node, config);
}

const stopListening = () => {
    if (observer) {
        observer.disconnect()
        observer = null
    }
}

// Mutes or unmutes all the audio
const muteAudio = (mute) => {
  if (muted !== mute) {
    document.querySelectorAll("audio").forEach(element => {
        element.muted = mute
    })

    muted = mute
  }
}

// Message handler
const onMessage = (action, response) => {
    let result = true

    // console.log("message: ", action)
    switch (action.name) {
        case "muteAll":
            muteAudio(action.value)
            break;

        case "muteUsers":
            // Start muting users
            if (action.value) {
                people = action.data
                startListening()

            // Stop muting users
            } else {
                stopListening()
                muteAudio(false)
            }
            break;
    }

    if (response) {
        response({
            result: result
        });
    }
}

// Listen to messages from others
chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        onMessage(request.action, sendResponse)
});

// Get notified when people array changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    for (var key in changes) {
      var changed = changes[key];
      if (key === "people") {
        people = changed.newValue
      }
    }
});

// Set initial persistent values
chrome.storage.sync.set({ muteAll: false });
chrome.storage.sync.set({ muteUsers: false });
chrome.storage.local.set({ joined: false });

// Poll to determine when user has joined a meeting
setInterval(() => {
    const isJoined = getUsers().length != 0
    if (isJoined !== joined) {
        chrome.storage.local.set({ joined: isJoined });
        joined = isJoined;
    }
}, 1000)

