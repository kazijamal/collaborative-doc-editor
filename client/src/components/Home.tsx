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
        const response = await axios.post(
            `${url_prefix}/collection/create`,
            { name: doc },
            { withCredentials: true }
        );
        navigate(`/edit/${response.data.id}`);
    };

    const deleteDoc = async (doc: any) => {
        const result = await axios.post(
            `${url_prefix}/collection/delete`,
            { id: doc.id },
            { withCredentials: true }
        );
        if (result.data.error) {
            setError('tried to delete non-existing document');
        } else {
            setDocs(docs.filter((document: any) => document.id !== doc.id));
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
            <form onSubmit={(e) => create(e, id)}>
                <label>
                    <h3>Create doc</h3>
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
            <br></br><hr></hr>
            {docs.map((doc: any) => {
                return (
                    <div key={doc.id}>
                        <Link to={`/edit/${doc.id}`}> <h3>Connect to {doc.name} </h3></Link>
                        {/* <div onClick={() => connect(doc)}>{doc}</div> */}
                        <button onClick={() => deleteDoc(doc)}>delete</button><br></br><br></br>
                    </div>
                );
            })}
            <hr></hr>
            <Link onClick={() => onLogout()} to='/'>
                <h3>Logout</h3>
            </Link>
        </div>
    );
};

export default Home;
