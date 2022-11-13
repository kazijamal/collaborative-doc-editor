import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import * as Y from 'yjs';

import Edit from './components/Edit';
import Home from './components/Home';
import Landing from './components/Landing';
import Login from './components/Login';
import Register from './components/Register';

function App() {
    const [name, setName] = useState('');

    const dev = true;
    const url_prefix = dev ? 'http://localhost:5001' : '';

    return (
        <Routes>
            <Route index element={<Landing />} />
            <Route
                path='register'
                element={<Register url_prefix={url_prefix} />}
            />
            <Route path='login' element={<Login url_prefix={url_prefix} setName={setName}/>} />
            <Route
                path='edit/:id'
                element={
                    <Edit url_prefix={url_prefix} name={name} />
                }
            />
            <Route
                path='home'
                element={
                    <Home
                        url_prefix={url_prefix}
                        setName={setName}
                    />
                }
            />
        </Routes>
    );
}

export default App;
