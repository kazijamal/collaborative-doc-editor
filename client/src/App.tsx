import React, { useState } from 'react';

import TextDocument from './components/TextDocument';
import ConnectForm from './components/ConnectForm';

function App() {
    const [docOpen, setDocOpen] = useState(false);
    const [id, setId] = useState('');
    const [syncValue, setSyncValue] = useState('');

    return docOpen ? (
        <TextDocument id={id} syncValue={syncValue} />
    ) : (
        <ConnectForm
            setDocOpen={setDocOpen}
            id={id}
            setId={setId}
            setSyncValue={setSyncValue}
        />
    );
}

export default App;
