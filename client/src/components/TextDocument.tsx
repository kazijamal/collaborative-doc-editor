import React, { useEffect } from 'react';
import { QuillBinding } from 'y-quill';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import { fromUint8Array } from 'js-base64';

type PropType = {
    id: any;
    ydoc: any;
};

const TextDocument = ({ id, ydoc }: PropType) => {
    let editor: any = null;
    let quillRef: any = null;

    useEffect(() => {
        attachQuillRefs();
        const ytext = ydoc.getText('quill');
        new QuillBinding(ytext, editor);
        ydoc.on('update', async (update: any) => {
            await axios.post(`/api/op/${id}`, {
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
