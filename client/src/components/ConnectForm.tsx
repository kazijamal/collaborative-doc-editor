import axios from 'axios';
import React, { useState } from 'react';

type PropType = {
    setDocOpen: (data: boolean) => void;
};

function ConnectForm({ setDocOpen }: PropType) {
    const [text, setText] = useState('');
    const connect = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        // await axios.get('/api/connect/:' + text);
        setDocOpen(true);
    };

    return (
        <div>
            <h1>Connect Form</h1>
            <form onSubmit={connect}>
                <label>
                    Connect to doc
                    <input
                        type='text'
                        id='docID'
                        name='docID'
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </label>
                <br></br>
                <input type='submit' />
            </form>
        </div>
    );
}

export default ConnectForm;
