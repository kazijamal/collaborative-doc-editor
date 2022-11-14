import React, { useEffect, useState, useMemo } from 'react';
import { QuillBinding } from 'y-quill';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import { fromUint8Array, toUint8Array } from 'js-base64';
import { useNavigate, useParams } from 'react-router-dom';
import * as Y from 'yjs';
import QuillCursors from 'quill-cursors';
import Cookies from 'js-cookie';

Quill.register('modules/cursors', QuillCursors);

type PropType = {
    url_prefix: string;
    name: any;
};

const Edit = ({ url_prefix, name }: PropType) => {
    let navigate = useNavigate();
    const { id } = useParams();
    const [source, setSource] = useState<any>();
    const [ydoc, setYdoc] = useState<any>();
    let editor: any = null;
    let quillRef: any = null;
    const [cursorPos, setCursorPos] = useState();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        attachQuillRefs();

        console.log(id);
        
        const eventSource = new EventSource(`${url_prefix}/api/connect/${id}`, {
            withCredentials: true,
        });

        eventSource.onopen = () => {
            setSource(eventSource);
            console.log('open');
        };

        eventSource.addEventListener('sync', (e: any) => {
            const syncEncoded = toUint8Array(e.data);
            const newDoc = new Y.Doc();
            Y.applyUpdate(newDoc, syncEncoded);

            const ytext = newDoc.getText('quill');
            new QuillBinding(ytext, editor);

            editor.on('selection-change', async (data: any) => {
                console.log('cursor change', data);
                if (data === null) return;
                setCursorPos(data.index);
                await axios.post(
                    `${url_prefix}/api/presence/${id}`,
                    {
                        
                        index: data.index,
                        length: data.length,
                    },
                    { withCredentials: true }
                );
            });

            newDoc.on('update', async (update: any) => {
                console.log('update with id', id);
                await axios.post(
                    `${url_prefix}/api/op/${id}`,
                    {
                        update: fromUint8Array(update),
                    },
                    { withCredentials: true }
                );
            });

            eventSource.addEventListener('update', (e: any) => {
                console.log('received update');
                const updateEncoded = toUint8Array(e.data);
                console.log(newDoc);
                Y.applyUpdate(newDoc, updateEncoded);
            });

            setYdoc(newDoc);
            setLoading(false);
        });

        eventSource.addEventListener('presence', (e: any) => {
            const cursors = editor.getModule('cursors');
            const presence = JSON.parse(e.data);

            // console.log(presence.cursor);

            const cursor_id = presence.session_id;

            if (presence.cursor.index == null) {
                cursors.removeCursor(cursor_id);
            } else {
                const colors = ['red', 'orange', 'green', 'blue', 'purple'];
                if (cursor_id !== Cookies.get('connect.sid')) {
                    cursors.createCursor(
                        cursor_id,
                        presence.name,
                        colors[Math.floor(Math.random() * colors.length)]
                    );
                    cursors.moveCursor(cursor_id, presence.cursor);
                }
            }
        });
    }, []);

    const disconnect = async () => {
        ydoc.destroy();
        source.close();
        navigate('/home');
    };

    const attachQuillRefs = () => {
        if (typeof quillRef.getEditor !== 'function') return;
        editor = quillRef.getEditor();
    };

    const imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();
        input.onchange = async () => {
            let file = null;
            if (input.files) {
                file = input.files[0];
            }
            if (file) {
                if (/^image\//.test(file.type)) {
                    const fd = new FormData();
                    fd.append('file', file);
                    const axiosres = await axios.post(
                        `${url_prefix}/media/upload`,
                        fd,
                        {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                            },
                            withCredentials: true,
                        }
                    );
                    editor.insertEmbed(
                        cursorPos,
                        'image',
                        `${url_prefix}/media/access/${axiosres.data.mediaid}`
                    );
                } else {
                    console.log('you can only upload images.');
                }
            }
        };
    };

    const modules = useMemo(
        () => ({
            toolbar: {
                container: [['bold', 'italic', 'underline'], ['image']],
                handlers: {
                    image: imageHandler,
                },
            },
            cursors: true,
        }),
        []
    );

    const formats = ['bold', 'italic', 'underline', 'image'];

    return (
            <div>
                {loading ? <h2>Loading, please wait..</h2> : ''}
                <ReactQuill
                    ref={(e) => {
                        quillRef = e;
                    }}
                    theme={'snow'}
                    modules={modules}
                    formats={formats}
                />
                <button onClick={disconnect}>Back to Home</button>
            </div>
    );
};

export default Edit;
