import React, {useState,useEffect, useRef} from 'react' 
import './App.css'

var timeout;
function App({socket}) {
  const [checkLogin, setCheckLogin] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(()=>{
    const sessionID = localStorage.getItem("sessionID");
    const usernameL = localStorage.getItem("username");
    if (sessionID) {
      socket.auth = { sessionID };
      setUsername(usernameL)
      setCheckLogin(true)
      socket.connect();
    }
  },[])

  return (
    <div className="App">
      <header className="App-header">
          {!checkLogin?<Login 
          setCheckLogin={setCheckLogin}
          username={username}
          setUsername={setUsername}
          socket={socket}
          />:<MessageBox 
          username={username} socket={socket} setCheckLogin={setCheckLogin}/>}
      </header>
    </div>
  );
}

const Login = ({setCheckLogin,username,setUsername,socket}) =>{
  const enterUserName = (e) =>{
    e.preventDefault();
    setCheckLogin(true)
    socket.auth = {username};
    socket.connect();
    socket.emit('chat',{message:'iam connected'})
  }
  return (
    <div style={{width:"100vw",height:"100vh",display:"grid",placeItems:"center"}}>
        <form onSubmit={enterUserName}>
          <input type="text" value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Enter name"/>
          <button type="submit">Enter</button>
        </form>
    </div>
  );
}


const MessageBox = ({username,socket,setCheckLogin}) =>{
  const [message,setMessage] = useState("");
  const [chat,setChat] = useState([])
  const [typing,setTyping] = useState("")
  const bottom = useRef();
  const sendMessage = (e) =>{
    e.preventDefault()
    socket.emit('chat', {message});
    setMessage('')
  }

  const logout = () =>{
    localStorage.removeItem('sessionID')
    localStorage.removeItem('username')
    socket.disconnect()
    setCheckLogin(false)
  }

  // typing functionality
  const timeoutFunction = () =>{
    socket.emit('typing',false)
  }
  const typingFunction = (e) =>{
      if(e.which!=13){
        socket.emit('typing', true)
        clearTimeout(timeout)
        timeout=setTimeout(timeoutFunction, 2000)
    }else{
        clearTimeout(timeout)
        timeoutFunction()
    }
  }
  useEffect(()=>{
    socket.on('typing', (data)=>{
      if(data){
        setTyping("( typing... )")
      }else {
        setTyping("")
      }
    })
  },[typing])
  // --------------------------------

  useEffect(()=>{
    socket.on("session", ({ sessionID, userID,username }) => {
      // attach the session ID to the next reconnection attempts
      socket.auth = { sessionID };
      // store it in the localStorage
      localStorage.setItem("sessionID", sessionID);
      localStorage.setItem("username",username)
      // save the ID of the user
      socket.userID = userID;
    });
  },[])

  // chat----------------------------
  useEffect(()=>{
    socket.on("chat",(payload)=>{
      setChat(payload)
      bottom.current.scrollIntoView({
        behavior:"smooth"
      })
    })
  },[])
  // ---------------------------------

  return(
    <div className="messageBox">
      <div className="messageTop" >
        {username} <span style={{fontSize:"0.9rem"}}>{typing}</span>
        <button onClick={logout}>logout</button>
      </div>
        <ul className="messageList">
        <li style={{visibility:'hidden'}} ref={bottom}></li>
          {chat.map((mes,index)=>(
            mes.user==username?
            <li key={index} className="right"> {mes.message} <span className="rightUser">{mes.user}</span></li>:
            <li key={index} className="left"><span className="leftUser">{mes.user}</span > {mes.message}</li>
          ))}
          
        </ul>
        <form  className="messageForm" onSubmit={sendMessage}>
          <input onKeyPress={(e)=>typingFunction(e)} type="text" value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="type your message"/>
          <button type="submit">Send</button>
        </form>
    </div>
  )
}

export default App;
