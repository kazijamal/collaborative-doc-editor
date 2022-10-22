import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function TextDocument() {
    const [value, setValue] = useState('');
    const modules = {
        toolbar: [['bold', 'italic', 'underline']],
    };

    const formats = ['bold, italic, underline'];

    const updateDocument = () => {
    };

    return (
        <div>
            <h1>Text Document</h1>
            <ReactQuill
                theme='snow'
                value={value}
                onChange={setValue}
                modules={modules}
                formats={formats}
            />
        </div>
    );
}

export default TextDocument;
