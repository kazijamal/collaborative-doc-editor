import React, { useState, useEffect } from 'react';
import * as Y from 'yjs';
import { toUint8Array } from 'js-base64';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie'; 


type PropType = {
    ydoc: any;
    setYdoc: any;
    url_prefix: string;
    source: any;
    setSource: any;
    setName: any;
};

const Home = ({ ydoc, setYdoc, url_prefix, source, setSource, setName }: PropType) => {
    let navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [docs, setDocs] = useState([]);
    const [error, setError] = useState('');
    const [id, setId] = useState('');

    const create = async (e: React.SyntheticEvent, doc: string) => {
        e.preventDefault();
        // is collection/create necessary?
        await axios.post(
            `${url_prefix}/collection/create`,
            { name: doc },
            { withCredentials: true }
        );
        await connect(doc);
    };

    const connect = async (doc: string) => {
        setLoading(true);
        const docExists = await axios.post(
            `${url_prefix}/collection/exists`,
            { id: doc },
            { withCredentials: true }
        );
        if (docExists.data.exists) {
            const eventSource = new EventSource(
                `${url_prefix}/api/connect/${doc}`,
                { withCredentials: true }
            );
            eventSource.onopen = () => {
                setSource(eventSource);
                console.log('open');
            };
            eventSource.addEventListener('sync', (e: any) => {
                console.log('received sync');

                const syncEncoded = toUint8Array(e.data);
                const newDoc = new Y.Doc();
                Y.applyUpdate(newDoc, syncEncoded);
                setYdoc(newDoc);
                setLoading(false);
                navigate(`/edit/${doc}`);
            });
        } else {
            setError('tried to connect to non-existing document');
        }
    };

    const deleteDoc = async (doc: string) => {
        const result = await axios.post(
            `${url_prefix}/collection/delete`,
            { id: doc },
            { withCredentials: true }
        );
        if (result.data.error) {
            setError('tried to delete non-existing document');
        } else {
            setDocs(docs.filter((docName) => docName !== doc));
        }
    };

    useEffect(() => {
        (async () => {
            let result = (
                await axios.post(
                    `${url_prefix}/collection/list`,
                    {},
                    { withCredentials: true }
                )
            ).data;
            console.log(result);
            result = result.map((doc: { id: string; name: string }) => doc.id);
            setDocs(result);
        })();
    }, []);

    const onLogout = async () => {
        const res = await axios.post(
            `${url_prefix}/users/logout`,
            {},
            { withCredentials: true }
        );
        setName('');
        console.log(res);
        navigate('/');
    };

    return loading ? (
        <p>Connecting...</p>
    ) : (
        <div>
            <h1>Home</h1>
            {error}
            {docs.map((doc: string) => {
                return (
                    <div key={doc}>
                        <div onClick={() => connect(doc)}>{doc}</div>
                        <button onClick={() => deleteDoc(doc)}>delete</button>
                    </div>
                );
            })}
            <form onSubmit={(e) => create(e, id)}>
                <label>
                    Create doc
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
            <Link onClick={() => onLogout()} to='/'>
                Logout
            </Link>
        </div>
    );
};

export default Home;
