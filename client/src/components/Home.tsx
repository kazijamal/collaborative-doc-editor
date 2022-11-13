import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

type PropType = {
    url_prefix: string;
    setName: any;
};

const Home = ({ url_prefix, setName }: PropType) => {
    let navigate = useNavigate();
    const [docs, setDocs] = useState([]);
    const [error, setError] = useState('');
    const [id, setId] = useState('');

    const create = async (e: React.SyntheticEvent, doc: string) => {
        e.preventDefault();
        await axios.post(
            `${url_prefix}/collection/create`,
            { name: doc },
            { withCredentials: true }
        );
        navigate(`/edit/${doc}`);
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
                await axios.get(`${url_prefix}/collection/list`, {
                    withCredentials: true,
                })
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

    return (
        <div>
            <h1>Home</h1>
            {error}
            {docs.map((doc: string) => {
                return (
                    <div key={doc}>
                        <Link to={`/edit/${doc}`}> Connect to {doc} </Link>
                        {/* <div onClick={() => connect(doc)}>{doc}</div> */}
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
