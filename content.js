let intervalMute
let observer
let people
let joined = false
let meeting = {}
let muted = false

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
                            meeting[person] = Date.now()
                            //console.log("Speaking: ", person)
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
                            meeting[person] = Date.now()
                            //console.log("Speaking: ", person)
                        }
                    }
                }
            }
        }
    }
};

const startListening = () => {
    meeting = {}

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

const muteSpeakers = (delay) => {
    const list = Object.keys(meeting)
    for (let x = 0; x < list.length; x++) {
        const person = list[x]
        const elapsed = (Date.now() - meeting[person])
        const speaking = elapsed <= 1000
        // if (elapsed > 1000) {
        //     console.log("elapsed: ", elapsed)
        // }
        if (speaking && people.some(person2 => person2.trim() === person.trim())) {
            console.log(person, " is speaking, muting audio")
            muteAudio(true)
            return
        }
    }

    console.log("unmuting audio")
    muteAudio(false)
}

// Message handelr
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
                if (intervalMute) {
                    return
                }

                startListening()

                people = action.data
                intervalMute = setInterval(() => {
                    if (people && people.length) {
                        muteSpeakers(250)
                    }
                }, 250)
            // Stop muting users
            } else {
                if (!intervalMute) {
                    return
                }

                if (intervalMute) {
                    stopListening()
                    muteAudio(false)
                    clearInterval(intervalMute)
                    intervalMute = null
                }
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

