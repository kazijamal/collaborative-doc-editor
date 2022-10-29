import React, { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { QuillBinding } from 'y-quill';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import { fromUint8Array, toUint8Array } from 'js-base64';

type PropType = {
    id: any;
    syncValue: any;
    updateValue: any;
};

const TextDocument = ({ id, syncValue, updateValue }: PropType) => {
    let editor: any = null;
    let quillRef: any = null;

    useEffect(() => {
        console.log('running useeffect');
        attachQuillRefs();
        const ydoc = new Y.Doc();
        const ytext = ydoc.getText('quill');
        const syncEncoded = toUint8Array(syncValue);
        Y.applyUpdate(ydoc, syncEncoded);
        new QuillBinding(ytext, editor);
        ydoc.on('update', async (update) => {
            console.log('sending update: ', update);
            const res = await axios.post(`http://localhost:5001/api/op/${id}`, {
                update: fromUint8Array(update),
            });
        });
    }, []);

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
        </div>
    );
};

export default TextDocument;
