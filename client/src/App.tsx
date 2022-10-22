import React, { useState } from 'react';

import TextDocument from './components/TextDocument';
import ConnectForm from './components/ConnectForm';

function App() {
    const [docOpen, setDocOpen] = useState(false);

    return docOpen ? <TextDocument /> : <ConnectForm setDocOpen={setDocOpen} />;
}

export default App;
