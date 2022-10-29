import React, { useState } from 'react';
import * as Y from 'yjs';
import { toUint8Array } from 'js-base64';

type PropType = {
    setDocOpen: (data: boolean) => void;
    id: any;
    setId: (data: any) => void;
    ydoc: any;
};

function ConnectForm({ setDocOpen, id, setId, ydoc }: PropType) {
    const [loading, setLoading] = useState(false);

    const connect = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        const eventSource = new EventSource(
            `/api/connect/${id}`,
            { withCredentials: true }
        );
        eventSource.onopen = (e) => {
            setLoading(false);
            setDocOpen(true);
        };
        eventSource.addEventListener('sync', (e) => {
            const syncEncoded = toUint8Array(e.data);
            Y.applyUpdate(ydoc, syncEncoded);
        });
        eventSource.addEventListener('update', (e) => {
            const updateEncoded = toUint8Array(e.data);
            Y.applyUpdate(ydoc, updateEncoded);
        });
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
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                    />
                </label>
                <br></br>
                <input type='submit' />
            </form>
        </div>
    );
}

export default ConnectForm;
