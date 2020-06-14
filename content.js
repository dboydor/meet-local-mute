let intervalMute

// Checks if a user is muted or not
const isMuted = (user) => {
    const found = document.querySelectorAll("div")
    for (let x = 0; x < found.length; x++) {
        const element = found[x]
        if (element.textContent === user) {
            if (   element.hasAttribute("jscontroller")
                && element.hasAttribute("jsaction")
                && element.hasAttribute("jsname")
                && !element.hasAttribute("data-layout")) {

              const found2 = element.querySelectorAll("div")
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
                            console.log(user + " is un-muted")
                            return "unmuted"
                        }
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

    switch (action) {
        case "start":
            if (intervalMute) {
                return
            }

            intervalMute = setInterval(() => {
                let status = isMuted("David Boyd")
                muteAudio(status === "unmuted")
                console.log(status, Date.now())
            }, 250)
            break;

        case "stop":
            if (!intervalMute) {
                return
            }

            if (intervalMute) {
                muteAudio(false)

                clearInterval(intervalMute)
                delete intervalMute
            }
            break;
    }

    response({
        result: result
    });
}

// Listen to messages from others
chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        onMessage(request.action, sendResponse)
});

// Set initial persistent values
chrome.storage.sync.set({ state: "stopped" });
chrome.storage.sync.set({ joined: false });

// Poll to determine when user has joined a meeting
setInterval(() => {
    const joined = document.querySelector("[__is_owner]") !== null && document.querySelector("[data-user-identifier]") === null
    chrome.storage.sync.set({ joined: joined });
}, 1000)

