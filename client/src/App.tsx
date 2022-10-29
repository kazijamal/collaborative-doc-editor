import React, { useState } from 'react';

import TextDocument from './components/TextDocument';
import ConnectForm from './components/ConnectForm';

function App() {
    const [docOpen, setDocOpen] = useState(false);
    const [id, setId] = useState('');
    const [syncValue, setSyncValue] = useState('');
    const [updateValue, setUpdateValue] = useState('');

    return docOpen ? (
        <TextDocument id={id} syncValue={syncValue} updateValue={updateValue} />
    ) : (
        <ConnectForm
            setDocOpen={setDocOpen}
            id={id}
            setId={setId}
            setSyncValue={setSyncValue}
            setUpdateValue={setUpdateValue}
        />
    );
}

export default App;
