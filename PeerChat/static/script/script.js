let interval; 
function holdButton(state) {
    sendRequest(state);

    interval = setInterval(() => { sendRequest(state); }, 500); 
}
function releaseButton(state) {
    clearInterval(interval);
    sendRequest(state);
}
function releaseButton_noSerial() {
    clearInterval(interval);
}
function sendRequest(command) {           
    fetch('/control_panel', {
        method: "POST", 
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "command=" + encodeURIComponent(command),
    })
    .then(response => response.text())
    .then(data => console.log("Server Response:", data))
    .catch(error => console.error("Error:", error));
}













// // [control pannel]
// let interval; // Variable to hold the interval ID

// function holdButton(state) {{

//     // Send the request immediately
//     sendRequest(state);

//     // Set an interval to keep sending the request while the button is held down
//     interval = setInterval(() => {{
//         sendRequest(state);
//     }}, 500); // Adjust the interval time as needed (500 ms here)
// }}

// function releaseButton(state) {{
//     // Clear the interval when the button is released
//     clearInterval(interval);
//     sendRequest(state);
// }}

// function releaseButton_noSerial() {{
//     // Clear the interval when the button is released
//     clearInterval(interval);
// }}

// // function sendRequest(state) {{
// //     // Create an XMLHttpRequest to send the POST request
// //     const xhr = new XMLHttpRequest();
// //     xhr.open("POST", "/"); // Set the URL to your server
// //     xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
// //     xhr.send("submit=" + state); // Send the data as key=value
// // }}

// // 這個function是在client有動作時(按鈕被按下)會呼叫到
// /* 之後此client端function會叫出fetch('/control_panel',打開flask_server端的/control_panel route, 
//     然後把資料丟過去到request.form那裡的"command"變數(因為body: "command=") 
//     用request.form.get("command")得到這個變數
//     */
// //當用Flask時, 去丟client --> server資料 
// function sendRequest(command) {
//     // fetch('/control_panel': 會叫出你的/control_panel route頁面on your flask server
//     fetch('/control_panel', {
//         method: "POST", //POST request: data is client --> server
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//         body: "command=" + encodeURIComponent(command),
//     })
//     .then(response => response.text())
//     .then(data => console.log("Server Response:", data))
//     .catch(error => console.error("Error:", error));
// }