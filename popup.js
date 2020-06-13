const updateButtons = () => {
	chrome.storage.sync.get('state', (data) => {
		const start = document.getElementById("start")
		const stop = document.getElementById("stop")

		if (start && stop) {
			const running = (data.state === "running")
			start.disabled = running
			stop.disabled = !running
		}
	});
}

const handleClick = (id, idOther) => {
	let button = document.getElementById(id);
	button.onclick = function (element) {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		  chrome.tabs.sendMessage(tabs[0].id, { action: id }, (response) => {
		  	const state = id === "start" ? "running" : "stopped"
	 		chrome.storage.sync.set({ state: state }, () => {
	        	updateButtons(id)
	        });
		  });
		});
	};
}

updateButtons()
handleClick("start")
handleClick("stop")
