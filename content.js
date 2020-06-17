let intervalMute
let people

const getUsers = () => {
    return document.querySelectorAll("div[jscontroller] > div[data-self-name]")
}

// Checks if a user is muted or not
const isMuted = (user) => {
    const found = getUsers()
    for (let x = 0; x < found.length; x++) {
        const element = found[x]
        if (element.textContent === user) {
            const sibling = element.previousElementSibling
            const found2 = sibling.querySelectorAll("div")
            for (let y = 0; y < found2.length; y++) {
                const element = found2[y]
                if (element.children.length === 3) {
                    let count = 0
                    for (let z = 0; z < element.children.length; z++) {
                        if (element.children[z].nodeName === "DIV") {
                            count++
                        }
                    }
                    if (count === 3) {
                        const rect = element.getBoundingClientRect()
                        if (rect.width === 0 && rect.height === 0) {
                            //console.log(user + " is muted")
                            return "muted"
                        } else {
                            //console.log(user + " is un-muted")
                            return "unmuted"
                        }
                    }
                }
            }
        }
    }

    //console.log(user + " not found")
    return "na"
}

// Mutes or unmutes all the audio
const muteAudio = (mute) => {
  document.querySelectorAll("audio").forEach(element => {
    element.muted = mute
  })
}

// Message handelr
const onMessage = (action, response) => {
    let result = true

console.log("message: ", action)
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

                people = action.data
                intervalMute = setInterval(() => {
                    if (people && people.length) {
                        let unmuted = people.some(person => isMuted(person) === "unmuted")
                        muteAudio(unmuted)
                        console.log("unmuted:" , unmuted, ", ", people)
                    }
                }, 250)
            // Stop muting users
            } else {
                if (!intervalMute) {
                    return
                }

                if (intervalMute) {
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
chrome.storage.sync.set({ joined: false });

// Poll to determine when user has joined a meeting
setInterval(() => {
    const joined = getUsers().length != 0
    chrome.storage.sync.set({ joined: joined });
}, 1000)

