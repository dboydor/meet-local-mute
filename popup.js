let meetingJoined = false;

// Wrapper to send message
const sendMessage = (action, callback) => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		chrome.tabs.sendMessage(tabs[0].id, { action: action }, callback)
	});
}

// Update UI with the correct state
const updateButtons = () => {
	chrome.storage.sync.get('state', (data) => {
		const start = document.getElementById("start")
		const stop = document.getElementById("stop")

		if (start && stop) {
			const running = (data.state === "running")
			start.disabled = meetingJoined ? running : true
			stop.disabled = meetingJoined ? !running : true
		}
	});
}

const handleClick = (id) => {
	let button = document.getElementById(id);
	button.onclick = (element) => {
		sendMessage(id, (response) => {
			const state = id === "start" ? "running" : "stopped"
			chrome.storage.sync.set({ state: state }, () => {
				updateButtons()
			})
		})
	}
}

// Get the initial joined state
chrome.storage.sync.get('joined', (data) => {
	meetingJoined = data.joined
})

// Get notified when joined state changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    for (var key in changes) {
      var changed = changes[key];
      if (key === "joined") {
          	meetingJoined = storageChange.newValue
			updateButtons()
      }
    }
});

updateButtons()
handleClick("start")
handleClick("stop")

