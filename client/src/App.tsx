import React, { useState } from 'react';
import * as Y from 'yjs';

import TextDocument from './components/TextDocument';
import ConnectForm from './components/ConnectForm';

function App() {
    const [docOpen, setDocOpen] = useState(false);
    const ydoc = new Y.Doc();

    return docOpen ? <TextDocument /> : <ConnectForm setDocOpen={setDocOpen} />;
}

export default App;
