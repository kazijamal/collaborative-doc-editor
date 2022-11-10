import React, { useState } from 'react';
import { Routes, Route } from "react-router-dom";
import * as Y from 'yjs';

import Edit from './components/Edit';
import Home from './components/Home';
import Landing from './components/Landing';
import Login from './components/Login';
import Register from './components/Register';


function App() {
    // const [id, setId] = useState('');
    const [ydoc, setYdoc] = useState(new Y.Doc());
    const [source, setSource] = useState();

    const dev = true;
    const url_prefix = (dev) ? 'http://localhost:5001' : '';

    return (
        <Routes>
            <Route index element={<Landing/>} />
            <Route path="register" element={<Register url_prefix={url_prefix}/>} />
            <Route path="login" element={<Login url_prefix={url_prefix}/>} />
            <Route path="edit/:id" element={
                <Edit ydoc={ydoc} url_prefix={url_prefix} source={source}/>
            }/>
            <Route path="home" element={
                <Home
                    setYdoc={setYdoc}
                    ydoc={ydoc}
                    url_prefix={url_prefix}
                    source={source}
                    setSource={setSource}/>
            }/>
        </Routes>
    )
}

export default App;
