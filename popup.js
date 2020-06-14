let meetingJoined = false;

// Wrapper to send message
const sendMessage = (id, value, callback) => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		chrome.tabs.sendMessage(tabs[0].id, { action: { name: id, value: value } }, callback)
	});
}

// Wrapper for storing settings
const saveOption = (id, value, callback) => {
	const store = {}
	store[id] = value
	chrome.storage.sync.set(store, () => {
		if (callback) {
			callback()
		}
	})
}

const updateBlocks = () => {
	console.log("joined: ", meetingJoined)
	if (meetingJoined) {
		document.getElementById("waiting").style.display = "none"
		document.querySelectorAll(".domain").forEach(element => element.style.display = "block")
	} else {
		document.getElementById("waiting").style.display = "block"
		document.querySelectorAll(".domain").forEach(element => element.style.display = "none")
	}
}

const initializeOptions = () => {
	const all = document.getElementById("muteAll")
	const users = document.getElementById("muteUsers")

	if (all && users) {
		chrome.storage.sync.get('muteAll', (data) => {
			all.checked = data.muteAll
		});

		chrome.storage.sync.get('muteUsers', (data) => {
			users.checked = data.muteUsers
		});
	}
}

const updateOptions = (checkbox) => {
	const all = document.getElementById("muteAll")
	const users = document.getElementById("muteUsers")

	if (all && users) {
		if (checkbox === all && users.checked) {
			users.checked = false
			saveOption("muteUsers", false)
			sendMessage("muteUsers", false)
		} else if (checkbox === users && all.checked) {
			all.checked = false
			saveOption("muteAll", false)
			sendMessage("muteAll", false)
		}
	}
}

const handleOption = (id) => {
	let button = document.getElementById(id);
	button.onclick = (element) => {
		saveOption(id, button.checked, () => {
			updateOptions(button)
			sendMessage(id, button.checked)
		})
	}
}

// Get the initial joined state
chrome.storage.sync.get('joined', (data) => {
	meetingJoined = data.joined
	updateBlocks()
})

// Get notified when joined state changes
chrome.storage.onChanged.addListener((changes, namespace) => {
	console.log("changed: ", changes)
    for (var key in changes) {
      var changed = changes[key];
      if (key === "joined") {
          	meetingJoined = storageChange.newValue
			updateBlocks()
      }
    }
});

updateBlocks()
initializeOptions()
handleOption("muteAll")
handleOption("muteUsers")
