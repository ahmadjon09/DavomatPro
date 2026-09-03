import React from 'react';import{createRoot}from'react-dom/client';import App from'./App';import'./styles.css';
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'));
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
