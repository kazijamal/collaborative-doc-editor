import React, { useEffect } from 'react';
import { QuillBinding } from 'y-quill';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import { fromUint8Array, toUint8Array } from 'js-base64';
import { Link, useParams } from 'react-router-dom';
import * as Y from 'yjs';
import Cookies from 'js-cookie';

type PropType = {
    ydoc: any;
    url_prefix: string;
    name: any;
    setName: any;
    source: any;
};

const Edit = ({ ydoc, url_prefix, name, setName, source }: PropType) => {
    const { id } = useParams();
    let editor: any = null;
    let quillRef: any = null;

    useEffect(() => {
        source.addEventListener('update', (e: any) => {
            const updateEncoded = toUint8Array(e.data);
            Y.applyUpdate(ydoc, updateEncoded);
        });
        attachQuillRefs();
        const ytext = ydoc.getText('quill');
        new QuillBinding(ytext, editor);
        editor.on('selection-change', async (data: any) => {
            let cookies = document.cookie.split(";");
            let sid = '';
            for (let cookie of cookies) {
                const key = cookie.split('=')[0];
                const value = cookie.split('=')[1];
                
                if (key === 'connect.sid')
                    sid = value;
            }
            await axios.post(
                `${url_prefix}/api/presence/${id}`,
                {   
                    session_id: sid,
                    name: name,
                    cursor: {
                        index: data.index,
                        length: data.length
                    }
                },
                { withCredentials: true }
            );
        });
        ydoc.on('update', async (update: any) => {
            console.log('update with id', id);
            await axios.post(
                `${url_prefix}/api/op/${id}`,
                {
                    update: fromUint8Array(update),
                },
                { withCredentials: true }
            );
        });
    }, []);

    const disconnect = () => {
        ydoc.destroy();
        source.close();
        setName('');
    };

    const attachQuillRefs = () => {
        if (typeof quillRef.getEditor !== 'function') return;
        editor = quillRef.getEditor();
    };

    return (
        <div>
            
            <ReactQuill
                ref={(e) => {
                    quillRef = e;
                }}
                theme={'snow'}
            />
            <Link onClick={disconnect} to='/home'>
                Back to home
            </Link>
        </div>
    );
};

export default Edit;
