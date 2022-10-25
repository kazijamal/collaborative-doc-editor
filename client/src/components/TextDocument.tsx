import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

type PropType = {
    eventSource: any;
};

function TextDocument({ eventSource }: PropType) {
    const [value, setValue] = useState('');

    // useEffect(() => {
    //     return () => {
    //         eventSource.close();
    //     };
    // }, []);

    const modules = {
        toolbar: [['bold', 'italic', 'underline']],
    };

    const formats = ['bold, italic, underline'];

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
