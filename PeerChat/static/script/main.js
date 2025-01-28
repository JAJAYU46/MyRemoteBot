/* <Note> 這邊做的都是client的code
(1) .mediaDevices.getUserMedia: 這是client(browser)的code, 現在是在處理 local camera <---> browser之間的溝通, 這些都是browser(client)要做的事情
(2) More information: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection
*/
// ========== Some Variable for our functions ======
///////////// for agora signalling (Step4) //////////
let APP_ID = "541f42e982754e0d83e8fd765cca5c78"
let token = null; //因為現在是用test模式, 所以我們沒有token, 是null
// let token = "007eJxTYHC4MDu0ZQvXg6ZHptdkGfUzFbZE9pV/5i+eumpu5Yona6YqMFgamqZZJBsmpRomGZuYmaYlWpqap5gkJaekGKSZGCYm7iqYnt4QyMgQZnqIiZEBAkF8FobcxMw8BgYAevwgZA=="
let uid = String(Math.floor(Math.random()*10000))//uid for every singal user that join the chat
// 你可以用id from a database, 也可以用uid generator, 現在這裡就是generate 一個隨機的數字
// 當一個user點進這個browser page, 就會有一個uid
let client; //client object (就是我們log in 的那個client跟有all these function 的access的那個client)
let channel; //之後會變成the channel where two user actually join



// import AgoraRTM from 'agora-rtm-sdk';
let localStream; //my local camera的stream, 之後要把這個資料從我 local 丟出去(要local --> remote)
let remoteStream;
let peerConnection;

///////////// for connecting to google stun server ///////////////
//這邊我們不自己建一個server去處理最開始和new peer client的相連, 我們直接用google的免費stun server
const servers={ //這是一個object, 我們要把這個object pass to 我們的RTCpeerConection物件, 讓他知道我們要取找哪個server幫我們當媒婆連接另一位peer client
    iceServers:[ //這是一個array
        {   //<Debug> 'stun:stun1.1.google.com:19302'這種個東西是個URL冒號後面是不可以有空格的
            urls:['stun:stun1.1.google.com:19302', 'stun:stun2.1.google.com:19302']//這邊要放你client想要去找的stun server, 現在我們直接用google的strun server
        }
    ]
}


// =================== our functions =====================
let init = async() =>{
    // [Step4] Signalling
    // [Step4-1] create a agora client(自己這個browser, 我自己) & client create a channel & 此client再join此channel
    console.log('typeof AgoraRTM:', typeof AgoraRTM); // 應該輸出 "object"
    console.log("Does AgoraRTM have createInstance?:", typeof AgoraRTM.createInstance === "function");
    // const { RTM } = AgoraRTM;
    // try {
    //     const rtm = new RTM(APP_ID, uid);
    // } catch (status) {
    //     console.log("Error");
    //     console.log(status);
    // }
    
    //======================
    client = await AgoraRTM.createInstance(APP_ID) // [Step4-1.1] create a client object
    
    await client.login({uid, token}) //[Step4-1.2] 等待這個browser client login Agora (只須給他的uid和token)

    //通常如果多channel的話會是用roomid
    // index.html?room_id=234234
    //channel = client.createChannel(room_id)
    channel = client.createChannel('main') //[Step4-1.3]此client create a channel: 讓這個client create 一個channel, .createChannel('channel_name') (這個function 會find a channel by this channel_name or create one if not finded)
    await channel.join() //[Step4-1.4] 此client join此channel

    // [Step4-2] Listen to 是否有另一個client加入這個channel
    channel.on('MemberJoined', handleUserJoined) //每當有另一個browser call channel.join() , 就會trigger此句 & 跑這個function: handleUserJoined
    // (現在這個channel 就是AgoraRTM.createInstance(APP_ID) 這個APP_ID是同個的client時空的channel)
    //==================
    // [Step9-3.1] 'MemberLeft'這個event是handle user"關掉視窗"時會觸發
    channel.on('MemberLeft', handleUserLeft) // channel有可以listen to 'MemberLeft' 這個event的功能



    // [Step5-2] //當有peer message來的時候(Step5-1)接收message用
    client.on('MessageFromPeer', handleMessageFromPeer)

    // [Step1] .getUserMedia(): 這個含式會徵求client(browser)的同意, 看是否同意開啟camera跟audio
    // await 會等待getUserMedia() ask permission做完
    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
    
    // [Step2] browser 呼叫這個id的Video tag <video id="user-1"> , 把它的src屬性設成我們得到的這個video跟audio的stream(就是把這個local得到的stream丟到html這個視窗上)
    // html document不是client也不是server, 它就是一個檔案, 現在client(此java code)正在修改這個檔案, 把它的video source改成local camera stream
    document.getElementById('user-1').srcObject=localStream

    // // [Step3] create offer 
    // // (建立連接器物件peerConnection, 把我們local的資訊寫到著個連接器上, 已提供之後跟別人連接. )
    // // 先建好 remoteStream 變數, 留著裝資料
    // createOffer()

}  

// for [Step9-3] 
let handleUserLeft = async (MemberID) => {
    document.getElementById('user-2').style.display = 'none'
}

// for [Step4-2]
let handleUserJoined = async (MemberID) => { //by default we will get the members uid
    console.log('A new user joined the channel: ', MemberID)
    // [Step3] create offer 
    // (建立連接器物件peerConnection, 把我們local的資訊寫到著個連接器上, 已提供之後跟別人連接. )
    // 先建好 remoteStream 變數, 留著裝資料
    createOffer(MemberID) //當有user join 我們就要create offer
    // 把我給對方的MemberID送到連接器去
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
    // Create peerconnection, peerconnection這個變數會存所有我們和另外那個peer的連接用的資訊
    peerConnection = new RTCPeerConnection(servers) //先initialize(建立)好一個連接資訊用連接器物件, 之後用來存放連接用的資料
    //servers: 我們在上便創建的那個server object, 告訴這個連接器要去找哪個stun
    
    // 把id='user-2' 那個視窗src屬性先改成那個remoteStream變數, 等之後remote stream有東東時video就會顯示在html檔案上了
    remoteStream = new MediaStream() // 先建立好一個remoteStreem變數, 之後要用來裝remoter來的video stream
    document.getElementById('user-2').srcObject=remoteStream
    // [Step9-2] 再createPeerConnection 當join時, 框框會出現
    // <Note> 更改html檔案, 就是用document.xxx.xxx
    document.getElementById('user-2').style.display = 'block' //display as a block element


    // [Step5-5] 當我refresh太快, 可能就會沒建立好localStream變成null 所以要先check一下去fix這個問題
    if(!localStream){ //如果沒有, 就建立localStream
        localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
        document.getElementById('user-1').srcObject=localStream
    }

    // [Step3-3] 先預先建好track通道, 把我們的loaclStream的track丟到我們的連接器上通出去: 在peer Connnection連結器上面建立一個track通道, 把localStream都丟上這個track通道
    // localStream.getTracks(): 取得localStream的track
    // .forEach((track) => { }): 把一個個每個track都做{ }中的事情
    // peerConnection.addTrack(track, localStream): 把client把每個localStream 的track都一個個傳給連接器, 從這個新開的通道track把localStream資料通出去給server
    // 在連接器上開通一個track通道, 把localStream一直丟到那個通道上(之後會把這個track通道給peer client)
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
            // console.log('New ICE candidate: ', event.candidate)
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
    // setLocalDescription: 這個set時會trigger [Step3-5]create a few ice candidates 

    // print
    // console.log('Offer:', offer) //<Just For Debug> (printf)只是印出我這個offer長怎樣。會顯示在檢視F10 console那邊

    // [Step5-1] 送訊息給有這個memberID的那個人(這個memberID是這個媒人server分給 channel 裡的人的(但這裡我們就是各個client自己random了個uid給server))
    // client.sendMessageToPeer({text: 'Hey!!!'}, MemberID)//把這個message透過這個channel送給有這個memberID的人
    // 現在就是要透過這個channel把我的offer資訊送給另一個peer
    // [Step5-3] 
    client.sendMessageToPeer({text: JSON.stringify({'type':'offer', 'offer':offer})}, MemberID)//把這個message透過這個channel送給有這個memberID的人
    // JSON.stringify({}): 把offer 的這個object的資訊轉成字串
    
    
    // [Step4] Signalling: 把我們的offer (along with each ice candidate we generated from Step 3-5, send to another new peer client
    /* 當那個new peer收到我們的offer資訊包, 它就會製造一個stp answer(內涵這個new peer自己的資訊) 然後send back to us
    當對方回的answer回來後, 這兩個peer就知道對方了, 就可互相通data了
    我們用agora 去做這個signalling (若不用這個的話, 就要自己建一個web server去當媒婆)(Q: 若agora是那個媒婆, 那google stun server 又是?)
    <Note> 
    agora: 才是那個媒人server(會創建一個共有頻道fu), 用來做setup, 處理兩新peer間交換offer/ answer (也可自建一個web server socket啥的)
    Stun server(google): 是用來讓兩client知道他們的public-facing IP address and port(也包含他們的ice candidate資訊), 因為現在很多ip都在NAT防火牆後面client看不到其他client, 這個server可以幫助兩client可以直接看到對方, 用agora server setup完之後的 "direct connection"  
    */

}

// [Step6] create answer (後加的那個要把自己資訊傳給來say hey 的人)
// 後加的這個人也要創建自己的連結器之類的, 像是create offer這樣, 所以乾脆把上面createOffer通用的地方都轉成寫到一個createPeerConnection function就好
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
// [Step9-1] 再main.css(optional): 當peer2退出時, 會隱藏peer2框框
// [Step9-2] 再createPeerConnection 當join時, 框框會出現
// [Step9-3.1] [Step9-3.2] 當user leave 時, 我們要再次把user-2框框hide起來 (在init)
// [Step9-3.2] 確保關掉視窗時這個user會leave this channel

// for [Step9-3.2]
let leaveChannel = async () => {
    // logout the channel as a user
    await channel.leave()
    await channel.logout()
}

// [Step9-3.2] 確保關掉視窗時這個user會leave this channel
// <Note> 但現在這個會有的問題是當有三個user, userC離開就會發動這個然後把顯示框框隱藏掉
// <Note> 加這段leave manually是因為如果我們沒有leave manually, agora 是在大概30秒後才會把這個user logout (=> 才會發動 'MemberLeft' 這個event & 發動handle member leave 的function)
window.addEventListener('beforeunload', leaveChannel) //[Step9-3.2] 當window被關掉(包含蓋上筆電), 在window被關掉前都會到這個event listener然後call leaveChannel這個function

// ======================= Our main.js code ===========================
// 當index.html這個檔案給到browser手上, 會連到這個main.js程式, 然後這個client(browser)就會開始從這裡執行程式
init()