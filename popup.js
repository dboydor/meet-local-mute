let meetingJoined = false;
let people = []

// Wrapper to send message
const sendMessage = (id, value, data) => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		chrome.tabs.sendMessage(tabs[0].id, { action: { name: id, value: value, data: data } })
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
	if (meetingJoined) {
		document.getElementById("waiting").style.display = "none"
		document.getElementById("joined").style.display = "inline-block"
	} else {
		document.getElementById("waiting").style.display = "flex"
		document.getElementById("joined").style.display = "none"
	}
}


const updateList = () => {
	let list = document.getElementById("people")
	if (list) {
		while (list.firstChild) {
		    list.removeChild(list.firstChild);
		}
		people.forEach(person => {
			let option = document.createElement("option");
			option.setAttribute("value", person);
			option.text = person
			list.appendChild(option);
		})
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
		if (id === "muteUsers" && people.length === 0) {
			button.checked = false
			return
		}
		saveOption(id, button.checked, () => {
			updateOptions(button)
			sendMessage(id, button.checked, people)
		})
	}
}

const handleAdd = () => {
	var openIt = document.getElementById("add");
	var modal = document.getElementById("modalAdd");

	// Get the <span> element that closes the modal
	var close = document.getElementsByClassName("close")[0];

	// When the user clicks on the button, open the modal
	openIt.onclick = () => {
		modal.style.display = "block";

		let text = document.getElementById("addName")
		text.value = "";
		text.focus()

		let addIt = document.getElementById("addPerson")
		addIt.onclick = () => {
			if (people.indexOf(text.value) === -1) {
				people.push(text.value)
			}
			saveOption("people", people)
			modal.style.display = "none"
			updateList()
		}
	}

	// When the user clicks on <span> (x), close the modal
	close.onclick = () => {
		modal.style.display = "none";
	}

	// When the user clicks anywhere outside of the modal, close it
	window.onclick = (event) => {
		if (event.target == modal) {
			modal.style.display = "none";
		}
	}
}

const handleRemove = () => {
	var remove = document.getElementById("remove");
	remove.onclick = () => {
		let list = document.getElementById("people")
		if (list) {
			if (list.selectedIndex >= 0) {
				people.splice(list.selectedIndex, 1)
				saveOption("people", people)
				updateList()

				if (!people.length) {
					const users = document.getElementById("muteUsers")
					users.checked = false
					saveOption("muteUsers", false)
					sendMessage("muteUsers", false)
				}
			}
		}

	}
}

// Get the initial people to mute
chrome.storage.sync.get('people', (data) => {
	people = data.people
	if (!people) {
		people = []
	}
	updateList()
})

// Get the initial joined state
chrome.storage.sync.get('joined', (data) => {
	meetingJoined = data.joined
	updateBlocks()
})

// Get notified when joined state changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    for (var key in changes) {
      var changed = changes[key];
      if (key === "joined") {
          	meetingJoined = changed.newValue
			updateBlocks()
      }
    }
});

handleAdd()
handleRemove()
initializeOptions()
handleOption("muteAll")
handleOption("muteUsers")
