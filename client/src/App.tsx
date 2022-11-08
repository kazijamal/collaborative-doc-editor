import React, { useState } from 'react';
import { Routes, Route } from "react-router-dom";
import * as Y from 'yjs';

import TextDocument from './components/TextDocument';
import Home from './components/Home';
import Landing from './components/Landing';
import Login from './components/Login';
import Register from './components/Register';


function App() {
    const [id, setId] = useState('');
    const [ydoc, setYdoc] = useState(new Y.Doc());

    const dev = true;
    const url_prefix = (dev) ? 'http://localhost:5001' : '';

    return (
        <Routes>
            <Route index element={<Landing/>} />
            <Route path="register" element={<Register url_prefix={url_prefix}/>} />
            <Route path="login" element={<Login url_prefix={url_prefix}/>} />
            <Route path="textdocument" element={
                <TextDocument id={id} ydoc={ydoc} url_prefix={url_prefix}/>
            }/>
            <Route path="home" element={
                <Home
                    id={id}
                    setId={setId}
                    ydoc={ydoc}
                    url_prefix={url_prefix}/>
            }/>
        </Routes>
    )
}

export default App;
