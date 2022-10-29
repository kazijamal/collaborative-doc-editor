import React, { useEffect } from 'react';
import * as Y from 'yjs';
import { QuillBinding } from 'y-quill';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import { fromUint8Array, toUint8Array } from 'js-base64';

type PropType = {
    id: any;
    syncValue: any;
};

const TextDocument = ({ id, syncValue }: PropType) => {
    let quillRef: any = null;
    let reactQuillRef: any = null;

    useEffect(() => {
        attachQuillRefs();
        const ydoc = new Y.Doc();
        const ytext = ydoc.getText('quill');
        const binaryEncoded = toUint8Array(syncValue);
        Y.applyUpdate(ydoc, binaryEncoded);
        new QuillBinding(ytext, quillRef);
        ydoc.on('update', async (update) => {
            console.log('sending update: ', update);
            const res = await axios.post(`http://localhost:5001/api/op/${id}`, {
                update: fromUint8Array(update),
            });
            console.log(res);
        });
    }, []);

    const attachQuillRefs = () => {
        if (typeof reactQuillRef.getEditor !== 'function') return;
        quillRef = reactQuillRef.getEditor();
    };

    return (
        <div>
            <ReactQuill
                ref={(e) => {
                    reactQuillRef = e;
                }}
                theme={'snow'}
            />
        </div>
    );
};

export default TextDocument;
