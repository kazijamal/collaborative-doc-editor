import React, { useEffect } from 'react';
import * as Y from 'yjs';
import { QuillBinding } from 'y-quill';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const TextDocument = () => {
    let quillRef: any = null;
    let reactQuillRef: any = null;

    useEffect(() => {
        attachQuillRefs();
        const ydoc = new Y.Doc();
        const ytext = ydoc.getText('quill');
        new QuillBinding(ytext, quillRef);
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
