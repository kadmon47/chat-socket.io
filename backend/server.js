const app = require('express')();

const server = require('http').createServer(app);
const io = require('socket.io')(server,{
    cors:{
        origin:"*",
    }
});

const crypto = require('crypto')
const randomId = () => crypto.randomBytes(8).toString("hex");

const { InMemorySessionStore } = require("./sessionStore");
const sessionStore = new InMemorySessionStore();


io.use((socket, next) => {
    const sessionID = socket.handshake.auth.sessionID;
    if (sessionID) {
        const session = sessionStore.findSession(sessionID);
        if (session) {
        socket.sessionID = sessionID;
        socket.userID = session.userID;
        socket.username = session.username;
        return next();
        }
    }
    const username = socket.handshake.auth.username;
    if (!username) {
        return next(new Error("invalid username"));
    }
    socket.sessionID = randomId();
    socket.userID = randomId();
    socket.username = username;
    next();
});

var chat = []
io.on('connection',(socket)=>{

    // persist session
    sessionStore.saveSession(socket.sessionID, {
        userID: socket.userID,
        username: socket.username,
        connected: true,
    });

    // send session
    socket.emit("session", {
        sessionID: socket.sessionID,
        userID: socket.userID,
        username:socket.username
    });

    // send thet total users to frontend
    const users = []
    sessionStore.findAllSessions().forEach((session) => {
        users.push({
          userID: session.userID,
          username: session.username,
          connected: session.connected,
          
        });
    });
    socket.emit("users", users);
    console.log(users)


    console.log(socket.username+' connected');

    // print the sessions
    sessionStore.printSession()

    
    // chat endpoint
    socket.on("chat",(payload)=>{
        console.log(payload)
        chat = [{user:socket.username,message:payload.message},...chat]
        socket.emit("chat",chat);
    })//---------------------

    // typing endpoint
    socket.on("typing",(data)=>{
        socket.broadcast.emit('typing',data)
    })//----------------------

    // disconnect endpoint
    socket.on('disconnect',async()=>{
        const matchingSockets = await io.in(socket.userID).allSockets();
        const isDisconnected = matchingSockets.size === 0;
        if (isDisconnected) {
            // notify other users
            socket.broadcast.emit("user disconnected", socket.userID);
            console.log(`${socket.username} disconnected`)
            // update the connection status of the session
            sessionStore.saveSession(socket.sessionID, {
                userID: socket.userID,
                username: socket.username,
                connected: false,
            });
        }
    })//-----------------------
})





server.listen(5000,()=>{
    console.log("server is listening at port 5000...")
})