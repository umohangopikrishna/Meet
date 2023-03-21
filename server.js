const express = require('express');

//------------ sql -------------
const mysql = require('mysql');
//-----------------------------

//----------- api call retrive data setup ---
var cors = require('cors');

//-------------------------------------------


const app = express();
const httpServer = require('http').Server(app);
const formidable = require('formidable');
const { v4: uuidv4 } = require("uuid");
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(httpServer,{
    debug: true
});
port = process.env.PORT || 3000;
const io = require("socket.io")(httpServer);

let roomId;

app.set("view engine","ejs");


app.use('',express.static(__dirname+"/public"));
app.use("/shareFiles",express.static(__dirname+"/Storage"));
app.use("/peerjs",peerServer);

//------------- api call setup--------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//-------------------------------------------------


//app.use('',express.static(__dirname+"node_modules/peerjs/dist/peerjs.min.js"));

app.get("/",(req,res)=>{

    res.redirect(`/${uuidv4()}`);

});

app.get("/:roomId",(req,res)=>{
    roomId = req.params.roomId; // parameter in url
    res.render('room',{roomId: roomId});
});

app.post("/upload/", (req, res) => {
    // var form = new formidable.IncomingForm();

    // form.parse(req);
    // let filesList =[];
    // form.on('fileBegin', function (name, file) {
    //     file.path = __dirname + '/Storage/' + file.name;
    // });

    // form.on('file', function (name, file) {
    //     console.log('Uploaded ' + file.name);
    //     filesList.push(file.name);
    //     res.send(file.name);
    // });
    console.log(req,"request data");
    var form = new formidable.IncomingForm();

    form.uploadDir = 'Storage';
    form.keepExtensions = true;
    form.multiples = true;
    form.parse(req, function (err, fields, files) {
        let filePaths =[];
       // console.log(err);
      //console.log(fields);
    try{
        for (let filePath of files["uploadedFile[]"])
           { filePaths.push(filePath.path);}
        //console.log(files["uploadedFile[]"][0].path);
        //console.log(files[0]);
        //let c=0;
        // for (const file of Object.entries(files)) {
            
        //     c++;
        // }
       // console.log(fields);
       
    }
    catch(expection)
    {
        filePaths.push(files["uploadedFile[]"].path);
    }

        res.json(filePaths);
    });


    

    

});


userListBySocketID={};
userListByPeerID={};
PeerIDUserName={};
io.on("connection",(socket)=>{
    userListBySocketID[socket.id]=null;
    //console.log("new peer is connected")
  


   socket.on("join-room",(roomID,userId,userName)=>{
   // console.log("join room is called ",roomID);
    socket.join(roomID);
    console.log(roomID);
    console.log(userId);
       userListByPeerID[userId]=[roomID,socket.id];
       userListBySocketID[socket.id] = [userId,roomID];
       PeerIDUserName[userId]=userName;
    socket.to(roomID).emit("newUserConnected",userId);
   });

   socket.on("getUserNameByPeerID",(peerID)=>{
       io.to(socket.id).emit("userNameReceiving", peerID, PeerIDUserName[peerID]);
   });

    socket.on("presentScreenSocket",(roomId,peerId , presenterName)=>{
        userListByPeerID[peerId] = [roomId, socket.id];
        socket.to(roomId).emit("shareScreening", peerId, presenterName);
    });

    socket.on("shareScreen2NewConnectedUsers", (userId,shareScreenId,presenterName)=>{
       
        console.log("new user is connected");

        io.to(userListByPeerID[userId][1]).emit("shareScreening",shareScreenId,presenterName);
    });

    socket.on("transmitMessage", (msgDetails) => {
        let messageDetails = JSON.parse(msgDetails);
        let RoomID = messageDetails.roomID;
        console.log(RoomID);
        socket.to(RoomID).emit("meetingmessage", JSON.stringify({ name: messageDetails.name, message: messageDetails.message, files: messageDetails.files}));
    });

   socket.on("disconnect",()=>{

    if (userListBySocketID[socket.id]!=null)
    {
           let userId = userListBySocketID[socket.id][0];
           let roomID = userListBySocketID[socket.id][1];
       socket.to(roomID).emit("userDisconnected",userId);
    }
   });
});




peerServer.on("connection",(client)=>{
    console.log(client);
});
peerServer.on("disconnect",(client)=>{
    console.log("disconnected ",client.id);
    io.to(userListByPeerID[client.id][0]).emit("userDisconnected",client.id);
});

//------------------------------ mysql --------------------------------------
// corsOption ={
//     origin: '*',
//     optionsSuccessStatus: 200,
//     methods: ['GET', 'PUT', 'POST', 'DELETE'],
//     allowedHeaders: [
//         'Content-Type',
//     ]
// };
// app.use(cors(corsOption));

// var con = mysql.createConnection({
//     host: "bhnt8bhuurpdgzv9tb3m-mysql.services.clever-cloud.com",
//     user: "u7spjl3pqmtgpsx0",
//     password: "uujKPZ98ewgRZdLpCj6g",
//     database: "bhnt8bhuurpdgzv9tb3m"
// });

// con.connect(function (err) {
//    // if (err) throw err;
//     console.log("MySql Connected!");
// });
// app.post('/StudentRegistration/',(req,res)=>{


//     var form = new formidable.IncomingForm();
//     form.uploadDir = 'Storage';
//     form.keepExtensions = true;
//     form.multiples = true;

//    // console.log(req.body);
//     form.parse(req, function (err, fields, files) {
//         let filePaths = [];
//         console.log(JSON.parse(fields.studentData));

//         try 
//         {
//             for (let filePath of files["profile"]) 
//             { 
//                 filePaths.push(filePath.path); 
//             }
//         }
//         catch (expection) 
//         {
//             filePaths.push(files["profile"].path);
//         }
//         const studentData = JSON.parse(fields.studentData);
//           insertStudentInfo(studentData).then(
//               (result)=>{
//                   res.json(result);
//                   console.log(result);
//               },
//               (error)=>{
//                   res.json(error);
//                   console.log(error);
//               });

//     });

// });

//  function insertStudentInfo(data)
// {
    
//     return(new Promise((noErrorFun,errorFun)=>{

//     var query = "insert into StudentTable(userName , rollno , emailid ,userPassword ,userPhoneNumber ,departmentName,section) values(" +
//         JSON.stringify(data.userName) + "," +
//         JSON.stringify(data.rollno) + "," +
//         JSON.stringify(data.emailid) + "," +
//         JSON.stringify(data.userPassword) + "," +
//         JSON.stringify(data.userPhoneNumber) + "," +
//         JSON.stringify(data.departmentName) + "," +
//         JSON.stringify(data.section) + ");";
//         con.query(query, (error, result) => {
//             console.log("request processing");
//            // console.log(result);
//             //return(result);
//             if(error != null)
//             { 
//                 console.log(result,"result .");
//                 errorFun(error);
//             }
//              else
//              {
//                  noErrorFun(result);
//              }

//                                      });
//     }));
// }

// ----------------------- port listener -----------------------------


httpServer.listen(port,()=>{
    console.log("project running on 3000 port")
    });