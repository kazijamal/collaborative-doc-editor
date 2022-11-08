import React, { useEffect } from 'react';
import { QuillBinding } from 'y-quill';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import { fromUint8Array } from 'js-base64';
import * as Y from 'yjs';

type PropType = {
    id: any;
    ydoc: Y.Doc;
    url_prefix: string;
};

const TextDocument = ({ id, ydoc, url_prefix }: PropType) => {
    let editor: any = null;
    let quillRef: any = null;

    useEffect(() => {
        attachQuillRefs();
        const ytext = ydoc.getText('quill');
        new QuillBinding(ytext, editor);
        ydoc.on('update', async (update: any) => {
            await axios.post(`${url_prefix}/api/op/${id}`, {
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
