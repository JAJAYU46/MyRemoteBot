// let interval; 
function clickButton_text(state, destination) {
    sendRequest_text(state, destination);

    // interval = setInterval(() => { sendRequest(state); }, 500); 
}

function clickButton_redirect(state, destination) {
    sendRequest_redirect(state, destination);

    // interval = setInterval(() => { sendRequest(state); }, 500); 
}

function sendRequest_text(command, destination) {           
    fetch(destination, {
        method: "POST", 
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "command=" + encodeURIComponent(command),
    })
    .then(response => response.text())
    .then(data => console.log("Server Response:", data))
    .catch(error => console.error("Error:", error));
}

function sendRequest_redirect(command, destination) {           
    fetch(destination, {
        method: "POST", 
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "command=" + encodeURIComponent(command),
    })
    .then(response => response.json())
    .then(data => {
        if (data.redirect) {
            window.location.href = data.redirect; // Redirect browser
        } else {
            console.error("Server Error:", data.error);
        }
    })
    .catch(error => console.error("Error:", error));
}