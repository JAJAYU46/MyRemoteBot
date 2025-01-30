let interval_remote; 
function holdButton_remote(state) {
    sendRequest_text(state);

    interval_remote = setInterval(() => { sendRequest_text(state); }, 500); 
}
function releaseButton_remote(state) {
    clearInterval(interval_remote);
    sendRequest_text(state);
}
function releaseButton_noSerial_remote() {
    clearInterval(interval_remote);
}
function sendRequest_text(command) {           
    fetch('/control_panel', {
        method: "POST", 
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "command=" + encodeURIComponent(command),
    })
    .then(response => response.text())
    .then(data => console.log("Server Response:", data))
    .catch(error => console.error("Error:", error));
}

// function clickButton_remote(state) {
//     sendRequest_text(state);
// }

