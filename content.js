const muter = (action) => {
    switch (action) {
        case "start":
            if (window.meetMuter) {
                return
            }

            window.meetMuter = setInterval(() => {
                let status = document.querySelector("[role=status]")
                if (status) {
                    status.innerText = "RUNNING: " + Date.now()
                }
            }, 250)
            break;

        case "stop":
            if (!window.meetMuter) {
                return
            }

            if (window.meetMuter) {
                clearInterval(window.meetMuter)
                delete window.meetMuter
                let status = document.querySelector("[role=status]")
                if (status) {
                    status.innerText = "STOPPED"
                }
            }
            break;
    }
}

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        muter(request.action)

        sendResponse({
            action: "complete"
        });
    });

