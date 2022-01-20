// import 'react-app-polyfill/ie11';
// import 'react-app-polyfill/stable';
// import ProxyPolyfillBuilder from 'proxy-polyfill/src/proxy';


import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';


// const proxyPolyfill = ProxyPolyfillBuilder();


ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);


