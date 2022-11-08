import React, { useState } from 'react';
import { Routes, Route, Link } from "react-router-dom";
import * as Y from 'yjs';

import TextDocument from './components/TextDocument';
import ConnectForm from './components/ConnectForm';
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
            <Route index element={<Landing />} />
            <Route path="textdocument" element={
                <TextDocument id={id} ydoc={ydoc} url_prefix={url_prefix}/>
            }/>
            <Route path="connectform" element={
                <ConnectForm
                    id={id}
                    setId={setId}
                    ydoc={ydoc}
                    url_prefix={url_prefix}/>
            }/>
        </Routes>
    )
    // return docOpen ? (
    //     <TextDocument id={id} ydoc={ydoc} url_prefix={url_prefix}/>
    // ) : (
    // );
}

export default App;
