import axios from 'axios';
import React, { useState } from 'react';

type PropType = {
    setDocOpen: (data: boolean) => void;
};

function ConnectForm({ setDocOpen }: PropType) {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);

    const connect = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        const eventSource = new EventSource(
            `http://localhost:5001/api/connect/${text}`
        );
        eventSource.onopen = (e) => {
            setLoading(false);
            eventSource.addEventListener('ping', (e) => {
                console.log(e);
            });
            setDocOpen(true);
        };
        eventSource.addEventListener('sync', (e) => {
            console.log(e);
        });
        eventSource.onmessage = (e: any) => {
            console.log(e.data);
        };
    };

    return loading ? (
        <p>Connecting...</p>
    ) : (
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
