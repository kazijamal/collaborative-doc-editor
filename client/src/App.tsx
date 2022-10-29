import React, { useState } from 'react';
import * as Y from 'yjs';

import TextDocument from './components/TextDocument';
import ConnectForm from './components/ConnectForm';

function App() {
    const [docOpen, setDocOpen] = useState(false);
    const [id, setId] = useState('');
    const [ydoc, setYdoc] = useState(new Y.Doc());

    return docOpen ? (
        <TextDocument id={id} ydoc={ydoc} />
    ) : (
        <ConnectForm
            setDocOpen={setDocOpen}
            id={id}
            setId={setId}
            ydoc={ydoc}
        />
    );
}

export default App;
