import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import io from 'socket.io-client'


const socket = io("http://localhost:5000",{
  autoConnect: false
});

ReactDOM.render(
  <React.StrictMode>
    <App socket={socket}/>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
