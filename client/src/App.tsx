import React, { useState } from 'react';

import TextDocument from './components/TextDocument';
import ConnectForm from './components/ConnectForm';

function App() {
    const [docOpen, setDocOpen] = useState(false);
    const [eventSource, setEventSource] = useState();

    return docOpen ? (
        <TextDocument eventSource={eventSource} />
    ) : (
        <ConnectForm setDocOpen={setDocOpen} setEventSource={setEventSource} />
    );
}

export default App;
