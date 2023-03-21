const socket = io();
const videoEle = document.createElement("video");
videoEle.muted  = true;
const divEle = document.createElement("div");
const videoPlaceHolder = document.getElementById("video-placeHolder");
let localStream;
var peer;
let newUserConnectedId;
let myName;
var screenPresentingPeer;
const playAudio = new Audio('Cute Sms.mp3');


socket.on('connect',()=>{
    //socket.emit("room",roomId);
    console.log("connected to server");
});

socket.on('error',(err)=>{
    console.log(err);
});

socket.on('newUserConnected',(newAddedUserID)=>{
      console.log("new connection is established")
     connectToNewUser(newAddedUserID);
});

socket.on("shareScreening",(shareScreeningId,presenterName)=>{
    console.log("some one started share screening");
    connectToShareScreening(shareScreeningId, presenterName);
});


socket.on("userDisconnected",(userID)=>{

    console.log("removeing called");
    var userObject = document.getElementById(userID);
    if (userObject!=null)
   {
      //var userObj =  document.getElementById(userID).
        console.log(userObject.children[1].innerHTML);
        document.getElementById("disconnectBox").style.display="block"
        document.getElementById("disconnectBox").children[0].innerHTML = userObject.children[1].innerHTML +" is Disconnected";
        
        setTimeout(()=>{
            document.getElementById("disconnectBox").style.display="none";
        },2500);

      console.log("user object ---------");
        userObject.remove();
    }
});

socket.on("meetingmessage",(message)=>{
    let messageDetails = JSON.parse(message);


    let messagerName = messageDetails.name;
    let userMessage = messageDetails.message;

    if (messageDetails.files == false)
    {
    showMessage(messagerName,userMessage);
    }
    else
    {
        showUploadedMedia(messagerName,userMessage);
    }
});

socket.on("userNameReceiving", (peerID,userName)=>{
    addUserNameToVideo(peerID, userName);
});

function addUserNameToVideo(peerID, userName)
{
    const h3Ele = document.createElement("h3");
    h3Ele.innerHTML = userName;
    document.getElementById(peerID).append(h3Ele);
}


function showMessage(name,message)
{
    console.log(message);
    const msgBoxDiv = document.getElementById("messageBox");
    const msgDiv = document.createElement("div");
    const userNameH5 = document.createElement("h5");
    userNameH5.innerHTML = name;
    const msgPreTag = document.createElement("pre");
    msgPreTag.innerHTML = message;
    msgDiv.append(userNameH5);
    msgDiv.append(msgPreTag);
    msgBoxDiv.append(msgDiv);

    msgDiv.scrollIntoView();

    playSignalAudio();
}

function playSignalAudio()
{
    playAudio.play();
}

function showUploadedMedia(name , mediaUrls)
{
    let mediaUrlSet = JSON.parse(mediaUrls);
    console.log(name);
    const msgBoxDiv = document.getElementById("messageBox");
    const msgDiv = document.createElement("div");
    const userNameH5 = document.createElement("h5");
    userNameH5.innerHTML = name;
    msgDiv.append(userNameH5);


    for(let mediaUrl of mediaUrlSet)
    {
        let url = mediaUrl.replace("Storage","shareFiles");
        //console.log(url);
        let downloadLink = document.createElement("a");
        downloadLink.href = url;
        downloadLink.download = "ClassRelatedDocument";
        downloadLink.innerHTML = "DownLoad File <span class='glyphicon glyphicon-save-file' style='font-size:20px;'></span>"
        msgDiv.append(downloadLink);
        msgDiv.append(document.createElement("br"));
        console.log(url);
    }
    msgBoxDiv.append(msgDiv);
    msgDiv.scrollIntoView();
    playSignalAudio();
}

function sendMessage()
{
    const message = document.getElementById("textAreaMessage").value;
    const userName = myName;
    const msgDetails = JSON.stringify({ name: userName, message: message, roomID: roomId, files: false});
    socket.emit("transmitMessage",msgDetails);
     
    showMessage("You",message);
    document.getElementById('textAreaMessage').value = ''
  
}

function startMeeting(){
    myName = document.getElementById("name").value;
    console.log(myName);
navigator.mediaDevices.getUserMedia({
    video: {
        frameRate: 24,
        width: {
            min: 480, ideal: 720, max: 1280
        },
        height: {
            max: 720
        },
        aspectRatio: 1.33333
    },
    audio:true
}).then(
    (stream)=>{
        localStream = stream;
        console.log("video is streaming");
        
        openPeer(stream);
        

       
    },
    (err)=>{console.log(err);});
}

function openPeer(stream){
   peer = new Peer(undefined, {
        path: '/peerjs',    // acctually here we need to specify port number but,
     //  port:  3000,                  // when we deploy the project the port and host will combained with the singnal name
        host: '/'            // so, we specify the host name only which include the host and port
    });                     // when we running project in locally
                          /** 
                           *  peer=new Peer(undefined,{path:'peerjs',host:'/',port:portNumber})
                           * 
                           */
    console.log("peer is opened");
    console.log(peer);
   peer.on('open', peerId => {
        console.log(peerId, "peer Id");
        let videoEle = document.createElement("video");
        videoEle.muted = true;
       addVideoStream(videoEle, stream,peerId,"You");


        socket.emit("join-room", roomId, peerId,myName);

        enableMessageBox();
    });


    // peer.on('connection', function (conn) {
    //     console.log("connection is build");
    //     conn.on('data', function (userName) {
    //         // Will print 'hi!'
    //         console.log(userName +"  userName");
    //         conn.send(myName);

            peer.on('call', (call) => {

                console.log(localStream);
                
                call.answer(localStream);


                const videoTag = document.createElement("video");
                call.on('stream', (userVideoStream) => {
                    console.log(call.peer + "  call peer ID");
                    if (newUserConnectedId != call.peer) {
                        console.log("streming is called");
                        addVideoStream(videoTag, userVideoStream, call.peer);
                        newUserConnectedId = call.peer;
                    }
                });

                call.on('error',(err)=>{
                    alert("poor internet");
                    closeConnection();
                });
            });
    //     });
    //     conn.on('error',(err)=>{console.log(err);})
    // });
    peer.on("error",(error)=>{
        alert("poor internet");
        closeConnection();
    });
    
}

function enableMessageBox()
{
    document.getElementById("messageArea").style.display = "block";
}
var screenSharingStream;
var screenSharingId;
function shareScreen()
{
    navigator.mediaDevices.getDisplayMedia({
        video: {
            "aspectRatio": 1.7777777777777777,
            "deviceId": "screen:0:0",
            "frameRate": 30,
            "height": 1080,
            "resizeMode": "crop-and-scale",
            "width": 1920,
            "cursor": "always",
            "displaySurface": "monitor",
            "logicalSurface": true},audio:true}).then((shareScreenStream)=>{
        // screenPresentingPeer = new Peer('screen-sharing-'+roomId+'1999', {
        //     path: '/peerjs',    // acctually here we need to specify port number but,
        //   port: 3000,                  // when we deploy the project the port and host will combained with the singnal name
        //     host: '/'  });
        //                   /**
        //  *  peer=new Peer(undefined,{path:'peerjs',host:'/',port:portNumber})
        //  *
        //  */
                screenPresentingPeer = new Peer(undefined,{path:'/peerjs',
                 // port: 3000,
                host:'/'});
        screenSharingStream = shareScreenStream;

        screenSharingStream.getVideoTracks()[0].onended = function () {
            // doWhatYouNeedToDo();
            console.log("share screening is stopped");
            screenPresentingPeer.disconnect();
            presentationStarted=false;
            screenSharingStream=null;
            screenPresentingPeer=null;

        };
        
        screenPresentingPeer.on("open",(peerId)=>{
            console.log(peerId);
            screenSharingId=peerId;
            socket.emit("presentScreenSocket", roomId,peerId,myName);
            presentationStarted=true;
        });

        screenPresentingPeer.on("call",(call)=>{
            call.answer(shareScreenStream);
        });

    });
}
var presentationStarted=false;
var newShareScreenConnectedId;
connectToShareScreening = (shareScreeningId,presenterName)=>{

    console.log(shareScreeningId);
    const call = peer.call(shareScreeningId, localStream);
    console.log(call);

    const videoTag = document.createElement("video");


    call.on('stream', (ScreenStream) => {
        
        if (newShareScreenConnectedId!=call.peer)
        {
            newShareScreenConnectedId = call.peer;
            console.log(newShareScreenConnectedId);
            const screenVideo = document.createElement("video");
            addVideoStream(screenVideo, ScreenStream, shareScreeningId, presenterName,"Screen Shareing");
        }
                                         });

                    }

function presentScreen(ScreenStream, shareScreeningId)
                {
                    const divTag = document.createElement("div");
                    const screenVideo = document.createElement("video");
                    screenVideo.srcObject = ScreenStream;
                    divTag.append(screenVideo);
                    document.body.append(divTag);

                   console.log(shareScreeningId);
                }

function addVideoStream(videoEle, myVideoStream, divId, userName=null,presentationMode=null)
{


    // if("srcObject" in videoEle)
    // videoEle.srcObject = myVideoStream;
    // else
    // videoEle.src = window.URL.createObjectURL(myVideoStream);
    // videoEle.play();
    // videoPlaceHolder.append(videoEle);
    

    if (presentationMode!=null)
    {
        videoEle.srcObject = myVideoStream;
        const divEle = document.createElement("div");
        divEle.id = divId;
        divEle.classList.add("presentationBox");
        const h1Ele = document.createElement("h1");
        h1Ele.innerHTML = userName+" is Presenting Now";
        videoEle.addEventListener("loadedmetadata", () => {
            videoEle.play();
            videoEle.controls = true;
            divEle.append(videoEle);
            divEle.append(h1Ele);
            document.body.append(divEle);
            //videoEle.removeEventListener("loadedmetadata",()=>{console.log("lister is removed");},(err)=>{console.log(err);});
        });
    }
    else{
    

    videoEle.srcObject = myVideoStream;
   const divEle = document.createElement("div");
    divEle.classList.add("videoBox");
    divEle.id=divId;
    
    // const h3Ele = document.createElement("h3");
    // h3Ele.innerHTML = userName;
    videoEle.addEventListener("loadedmetadata",()=>{
        videoEle.play();
        divEle.append(videoEle);
       // divEle.append(h3Ele);
        videoPlaceHolder.append(divEle);

        if (userName == "You")
        {
            addUserNameToVideo(divId,"You");
        }else
        {
        socket.emit("getUserNameByPeerID", divId);
        }
        //videoEle.removeEventListener("loadedmetadata",()=>{console.log("lister is removed");},(err)=>{console.log(err);});
    });
   }

}





connectToNewUser = (userId)=>{

    console.log(newShareScreenConnectedId);
    if (presentationStarted==true)
    {
       // socket.emit("shareScreen2NewConnectedUsers", userId, 'screen-sharing-' + roomId + '1999' , myName);
        socket.emit("shareScreen2NewConnectedUsers", userId, screenSharingId,myName);
    }


    console.log("New User Connecting " , userId);
    // const dataConnect = peer.connect(userId);
    // dataConnect.on('open',()=>{
    //     console.log("datachannel is build" + myName);
    //     dataConnect.send(myName);
    // });
    // dataConnect.on('data',(anotherName)=>{
    //     console.log(anotherName,"user name");
   
    const call = peer.call(userId, localStream);
    console.log(call);

    const videoTag = document.createElement("video");


    call.on('stream',(userVideoStream)=>{
        console.log("new User streaming");
        console.log("caller Peer Id "+ call.peer);
        if(newUserConnectedId!=call.peer)
        { //console.log(newUserConnectedId , call.peer);
           newUserConnectedId = call.peer;
           
            addVideoStream(videoTag, userVideoStream, call.peer);
            
         }
    });

        call.on('error', (err) => {
            console.log(err);
        })

    // });


    
    
}

function closeConnection()
{
    peer.disconnect();

    closeWebCamera();
    closeScreenSharing();
    console.log("peer is closed");
    peer=null;
    newUserConnectedId=null;
    document.getElementById("startMeeting").disabled = false;
    document.getElementById("messageArea").style.display = "none";
}

function closeScreenSharing()
{
    if (screenSharingStream!=null)
    {
        console.log("share screen is off");
        screenSharingStream.getTracks().forEach(function (track) {
            track.stop();
        });
        screenPresentingPeer.disconnect();
        screenPresentingPeer.destroy();
        presentationStarted = false;
        screenSharingStream = null;
        screenPresentingPeer = null;
        
    }
}
function closeWebCamera()
{
    let childList = document.getElementById("video-placeHolder").children;
   while(childList.length!=0)
   {
       childList[0].removeEventListener("loadedmetadata" ,()=>{});
       childList[0].remove();
   } 
   
    localStream.getTracks().forEach(function (track) {
        track.stop();
    });
    localStream=null;
}


let isAudio = true
function muteAudio() {
    isAudio = !isAudio
    localStream.getAudioTracks()[0].enabled = isAudio
}

let isVideo = true
function muteVideo() {
    isVideo = !isVideo
    localStream.getVideoTracks()[0].enabled = isVideo
}


function uploaded() 
{
    const inputfile = document.getElementById("inputfile").files;
   console.log(inputfile);
    if (inputfile.length != 0){
    const xhttp = new XMLHttpRequest();
    const formData = new FormData();
     console.log(inputfile);

    

    for (const file of inputfile) {
        formData.append("uploadedFile[]", file);
    }
    document.getElementById("uploadButton").disabled = true;
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          //  /shareFiles/

          console.log(JSON.parse(this.responseText));
            // const name = "You";
            // const message = this.responseText;
            // console.log(message);
            // const msgBoxDiv = document.getElementById("messageBox");
            // const msgDiv = document.createElement("div");
            // const userNameH5 = document.createElement("h5");
            // userNameH5.innerHTML = name;
            // const msgPreTag = document.createElement("pre");
            // msgPreTag.innerHTML = message;
            // msgDiv.append(userNameH5);
            // msgDiv.append(msgPreTag);
            // msgBoxDiv.append(msgDiv);
           console.log(this.responseText);
            const message = this.responseText;
            const userName = myName;
            const msgDetails = JSON.stringify({ name: userName, message: message, roomID: roomId,files:true});

            console.log(msgDetails);
            socket.emit("transmitMessage", msgDetails);
            showUploadedMedia("You", message);
            console.log("showUploadedMedia called");
            document.getElementById("uploadButton").disabled = false;
           // document.getElementById("loader").style.display = "none";
            document.getElementById("inputfile").value = "";
        }
        
    };
    xhttp.open("post", "upload/");
    xhttp.send(formData);
}
}