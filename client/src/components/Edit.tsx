import React, { useEffect } from 'react';
import { QuillBinding } from 'y-quill';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import { fromUint8Array } from 'js-base64';
import { Link, useParams } from 'react-router-dom';
import * as Y from 'yjs';

type PropType = {
    ydoc: any;
    url_prefix: string;
    source: any
};

const Edit = ({ ydoc, url_prefix, source }: PropType) => {
    const { id } = useParams();
    console.log(id);
    let editor: any = null;
    let quillRef: any = null;

    useEffect(() => {
        attachQuillRefs();
        const ytext = ydoc.getText('quill');
        new QuillBinding(ytext, editor);
        ydoc.on('update', async (update: any) => {
            console.log('update with id', id);
            await axios.post(`${url_prefix}/api/op/${id}`, {
                update: fromUint8Array(update),
            }, 
            { withCredentials: true }
            );
        }); 
    }, []);

    const disconnect = () => {
        ydoc.destroy();
        source.close();
    }

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
            <Link onClick={disconnect} to="/home">Back to home</Link>
        </div>
    );
};

export default Edit;
