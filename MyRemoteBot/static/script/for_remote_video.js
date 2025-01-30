// handleButtonClick('mic')
// =================== our functions for video button =====================
let mic_status = true;
let cam_status = true;


// function handleButtonClick(device) {
//     if(device=='mic'){
//         if(mic_status==true){
//             mic_status=false;
//             document.getElementById('micButton').style.backgroundColor = "#4CAF50"//rgb(74, 172, 77);
//         }else{
//             mic_status=true;
//             document.getElementById('micButton').style.backgroundColor ="#F71717"//rgb(247, 25, 25);
//         }
//         console.log('mic status: ', mic_status)
//     }else if(device=='cam'){
//         if(cam_status==true){
//             cam_status=false;
//             document.getElementById('camButton').style.backgroundColor = "#4CAF50"//rgb(74, 172, 77);
//         }else{
//             cam_status=true;
//             document.getElementById('camButton').style.backgroundColor = "#F71717"//rgb(247, 25, 25);
//         }
//         console.log('cam status: ', cam_status)
//     }
//     refreshLocalStream();
// }

// let refreshLocalStream = async() =>{
//     if(mic_status==false && cam_status==false){
//         localStream = null    
//     }
//     else{
//         localStream = await navigator.mediaDevices.getUserMedia({video:cam_status, audio:mic_status})
//     }
//     // [Step2] browser 呼叫這個id的Video tag <video id="user-1"> , 把它的src屬性設成我們得到的這個video跟audio的stream(就是把這個local得到的stream丟到html這個視窗上)
//     document.getElementById('user-1').srcObject=localStream



//     // // Replace the local stream tracks in the peer connection
//     // if (peerConnection && localStream) {
//     //     // Get all tracks from the new localStream
//     //     const newTracks = localStream.getTracks();

//     //     // Remove old tracks from the peer connection
//     //     peerConnection.getSenders().forEach(sender => {
//     //         sender.replaceTrack(newTracks.find(track => track.kind === sender.track.kind));
//     //     });
//     // }

// }


// ========== Some Variable for our functions for video streaming ======
let APP_ID = "541f42e982754e0d83e8fd765cca5c78"
let token = null;

let uid = String(Math.floor(Math.random()*10000))//uid for every singal user that join the chat

let client;
let channel;

let localStream; //my local camera的stream, 之後要把這個資料從我 local 丟出去(要local --> remote)
let remoteStream;
let peerConnection;

///////////// for connecting to google stun server ///////////////
const servers={ //這是一個object, 我們要把這個object pass to 我們的RTCpeerConection物件, 讓他知道我們要取找哪個server幫我們當媒婆連接另一位peer client
    iceServers:[ //這是一個array
        {   //<Debug> 'stun:stun1.1.google.com:19302'這種個東西是個URL冒號後面是不可以有空格的
            urls:['stun:stun1.1.google.com:19302', 'stun:stun2.1.google.com:19302']//這邊要放你client想要去找的stun server, 現在我們直接用google的strun server
        }
    ]
}

// =================== our functions for video Streaming =====================
let init = async() =>{
    ////// for video button //////

    // [Step4] Signalling
    console.log('typeof AgoraRTM:', typeof AgoraRTM); // 應該輸出 "object"
    console.log("Does AgoraRTM have createInstance?:", typeof AgoraRTM.createInstance === "function");
    client = await AgoraRTM.createInstance(APP_ID) // [Step4-1.1] create a client object
    
    await client.login({uid, token}) //[Step4-1.2] 等待這個browser client login Agora (只須給他的uid和token)
    channel = client.createChannel('main') //[Step4-1.3]此client create a channel: 讓這個client create 一個channel, .createChannel('channel_name') (這個function 會find a channel by this channel_name or create one if not finded)
    await channel.join() //[Step4-1.4] 此client join此channel
    channel.on('MemberJoined', handleUserJoined) //每當有另一個browser call channel.join() , 就會trigger此句 & 跑這個function: handleUserJoined

    // [Step9-3.1] 'MemberLeft'這個event是handle user"關掉視窗"時會觸發
    channel.on('MemberLeft', handleUserLeft) // channel有可以listen to 'MemberLeft' 這個event的功能

    // [Step5-2] //當有peer message來的時候(Step5-1)接收message用
    client.on('MessageFromPeer', handleMessageFromPeer)

    // [Step1] .getUserMedia(): 這個含式會徵求client(browser)的同意, 看是否同意開啟camera跟audio
    // localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
    localStream = await navigator.mediaDevices.getUserMedia({video:cam_status, audio:mic_status})
    
    // [Step2] browser 呼叫這個id的Video tag <video id="user-1"> , 把它的src屬性設成我們得到的這個video跟audio的stream(就是把這個local得到的stream丟到html這個視窗上)
    document.getElementById('user-1').srcObject=localStream

    // initial set up color 
    if(mic_status==false){
        // document.getElementById('micButton').style.backgroundColor = "#4CAF50"//rgb(74, 172, 77);
        document.getElementById('mic-btn').style.backgroundColor = 'rgba(33, 33, 33, 0.8)'
    }else{
        document.getElementById('mic-btn').style.backgroundColor = '#1e90ff'
    }
    if(cam_status==false){
        document.getElementById('camera-btn').style.backgroundColor = 'rgba(33, 33, 33, 0.8)'
    }else{
        document.getElementById('camera-btn').style.backgroundColor = '#1e90ff'
    }
    
    // ======================= Control Camera & Mic ===========================
    document.getElementById('camera-btn').addEventListener('click', toggleCamera) //add click event
    document.getElementById('mic-btn').addEventListener('click', toggleMic) //add click eventv
}
  
// for [Step9-3] 
let handleUserLeft = async (MemberID) => {
    document.getElementById('user-2').style.display = 'none'
    //////////// 調整小框大框 ///////////
    // 把它加一個class = "smallFrame"給main.css用
    document.getElementById('user-1').classList.remove('smallFrame') //display as a block element
    // 如果user2不見了, 就把視窗變成大視窗
}
// for [Step4-2]
let handleUserJoined = async (MemberID) => { //by default we will get the members uid
    console.log('A new user joined the channel: ', MemberID)
    // [Step3] create offer 
    createOffer(MemberID) //當有user join 我們就要create offer
}
// for [Step5-2]
let handleMessageFromPeer = async(message, MemberID) => { //get the message and memberID(誰傳這個訊息來的)
    
    message = JSON.parse(message.text) //Converts a JavaScript Object Notation (JSON) string into an object.
    console.log('Message: ', message);
    console.log('This is from: ', MemberID)

    // [Step6] create answer  
    if(message.type === 'offer'){ //如果你接收到的(自channel接收)資料是offer, 你就要建立answer然後回傳
        createAnswer(MemberID, message.offer)
    }
    // [Step7] 如果接收到自peer的訊息是一個answer, 就代表整個去回資料都來了, 我要把對方answer的連接資訊存到我的連接器上
    if(message.type === 'answer'){
        addAnswer(message.answer)
    }

    // [Step8] 把對方的ice candidate資訊寫到我的連接器資訊上
    if(message.type === 'candidate'){
        if(peerConnection){ //檢查如果我們已經有peer connection連接器了
            peerConnection.addIceCandidate(message.candidate)
        }
    }

}
// [Step6-1] 把createOffer & createAnswer 共用的地方(成立連結器...peerConnection/ 建立ice candidate...)都寫成一個function一起用
let createPeerConnection = async (MemberID) => {
    // [Step3-1] 先initialize建立好peerConnection和remoteStreem用來之後要裝資料用
    peerConnection = new RTCPeerConnection(servers) //先initialize(建立)好一個連接資訊用連接器物件, 之後用來存放連接用的資料
    
    // 把id='user-2' 那個視窗src屬性先改成那個remoteStream變數, 等之後remote stream有東東時video就會顯示在html檔案上了
    remoteStream = new MediaStream() // 先建立好一個remoteStreem變數, 之後要用來裝remoter來的video stream
    document.getElementById('user-2').srcObject=remoteStream
    
    // [Step9-2] 再createPeerConnection 當join時, 框框會出現
    document.getElementById('user-2').style.display = 'block' //display as a block element

    //////////// 調整小框大框 ///////////
    // 把它加一個class = "smallFrame"給main.css用
    document.getElementById('user-1').classList.add('smallFrame') //display as a block element


    // [Step5-5] 當我refresh太快, 可能就會沒建立好localStream變成null 所以要先check一下去fix這個問題
    if(!localStream){ //如果沒有, 就建立localStream
        localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
        // if(cam_status==false & mic_status==false){
        //     localStream=null    
        // }else{
        //     localStream = await navigator.mediaDevices.getUserMedia({video:cam_status, audio:mic_status})
        // }
        document.getElementById('user-1').srcObject=localStream
    }

    // [Step3-3] 先預先建好track通道, 把我們的loaclStream的track丟到我們的連接器上通出去: 在peer Connnection連結器上面建立一個track通道, 把localStream都丟上這個track通道
    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
    })

    // [Step3-4] 先預先建好track通道fu, 接收從peer 那邊來的stream track資料, 然後存到我們的remoteStream變數上
    // listen to every time remote candidate add track
    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track) //把這個從peer client那邊來的stream track存到我們remoteStream變數的track上
        })
    }

    
    // [Step3-5] 建立ice candidate
    peerConnection.onicecandidate = async(event) => {
        if(event.candidate){ //make sure our event is an ice candidate, check if we have ice candidate
            // [Step5-4] send ice candidate information to peer
            client.sendMessageToPeer({text: JSON.stringify({'type':'candidate', 'candidate':event.candidate})}, MemberID)//把這個message透過這個channel送給有這個memberID的人
        }
    }

}
let createOffer = async(MemberID) => {
    // [Step3-1] 寫到[Step6-1]共用function去了
    await createPeerConnection(MemberID)

    // [Step3-2] create connection offer (建立一個connection offer)
    let  offer = await peerConnection.createOffer() //利用這個連接器create一個offer(寫著我這個人的資訊, 等待著別人來連接) //await等待這件事情做完
    await peerConnection.setLocalDescription(offer) //把我這個人(也就是我這個連結器)的的資訊寫在我的localDescription上
    
    // [Step5-1] 送訊息給有這個memberID的那個人(這個memberID是這個媒人server分給 channel 裡的人的(但這裡我們就是各個client自己random了個uid給server))
    // [Step5-3] 
    client.sendMessageToPeer({text: JSON.stringify({'type':'offer', 'offer':offer})}, MemberID)//把這個message透過這個channel送給有這個memberID的人
    
    // [Step4] Signalling: 把我們的offer (along with each ice candidate we generated from Step 3-5, send to another new peer client
    
}
// [Step6] create answer (後加的那個要把自己資訊傳給來say hey 的人)
let createAnswer = async(MemberID, offer) => { //create Answer會多一個對方peer的offer這個東東傳入
    // [Step6-1] 現在peer2(recieving peer)製造answer要把自己資料傳出去
    await createPeerConnection(MemberID)
    await peerConnection.setRemoteDescription(offer) //peer2(receive 對方offer的peer) 的 remotedescription就是peer1(就在它的offer中)
    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    // [Step6-2] 把自己的資料寫進answer然後丟出去
    client.sendMessageToPeer({text: JSON.stringify({'type':'answer', 'answer':answer})}, MemberID)//把這個message透過這個channel送給有這個memberID的人
    
}
// [Step7]
let addAnswer = async (answer) =>{
    if(!peerConnection.currentRemoteDescription){ //如果我(peer1)的連接器上還沒設remote Discription的話, 我要把對方的資料存在我的remote description上
        peerConnection.setRemoteDescription(answer)
    }
}
// [Step9]  當peer2退出時, 會隱藏peer2框框, 當join時, 框框會出現
// for [Step9-3.2]
let leaveChannel = async () => {
    // logout the channel as a user
    await channel.leave()
    await channel.logout()
}
// [Step9-3.2] 確保關掉視窗時這個user會leave this channel
window.addEventListener('beforeunload', leaveChannel) //[Step9-3.2] 當window被關掉(包含蓋上筆電), 在window被關掉前都會到這個event listener然後call leaveChannel這個function


// ======================= For Control Camera & Mic ===========================
let toggleCamera = async() => {
    // get localStream 中種類為video的track
    let videoTrack = localStream.getTracks().find(track => track.kind=='video')
    if(videoTrack.enabled){ //按一下換個狀態
        // 如果videoTrack是enable的, 就把它turn off
        videoTrack.enabled = false
        cam_status=false
        document.getElementById('camera-btn').style.backgroundColor = 'rgba(33, 33, 33, 0.8)'
    }else{
        videoTrack.enabled = true
        cam_status=true
        document.getElementById('camera-btn').style.backgroundColor = '#1e90ff'
    }

}
let toggleMic = async() => {
    // get localStream 中種類為video的track
    let audioTrack = localStream.getTracks().find(track => track.kind=='audio')
    if(audioTrack.enabled){ //按一下換個狀態
        // 如果videoTrack是enable的, 就把它turn off
        audioTrack.enabled = false
        mic_status=false
        document.getElementById('mic-btn').style.backgroundColor = 'rgba(33, 33, 33, 0.8)'//'rgb(255, 80, 80)'
    }else{
        audioTrack.enabled = true
        mic_status=true
        document.getElementById('mic-btn').style.backgroundColor = '#1e90ff'
    }

}
// =================== our functions for Flask Logout when hang up the phone =====================
// Force Logout on Tab Close
window.addEventListener("beforeunload", function() {
    fetch('/logout', { method: 'GET' }) // Call logout route
});

function logoutAndRedirect() {
    fetch('/logout', { method: 'GET' }) // Call logout route
    .then(() => {
        window.location.href = "/"; // Redirect to home after logout
    });
}


// ======================= Our main code part ===========================

init()
