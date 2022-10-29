import React, { useState } from 'react';

type PropType = {
    setDocOpen: (data: boolean) => void;
    id: any;
    setId: (data: any) => void;
    setSyncValue: (data: any) => void;
};

function ConnectForm({ setDocOpen, id, setId, setSyncValue }: PropType) {
    const [loading, setLoading] = useState(false);

    const connect = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        const eventSource = new EventSource(
            `http://localhost:5001/api/connect/${id}`
        );
        eventSource.onopen = (e) => {
            setLoading(false);
            setDocOpen(true);
        };
        eventSource.addEventListener('sync', (e) => {
            setSyncValue(e.data);
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
