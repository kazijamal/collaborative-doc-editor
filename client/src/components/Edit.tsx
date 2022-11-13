import React, { useEffect } from 'react';
import { QuillBinding } from 'y-quill';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import { fromUint8Array, toUint8Array } from 'js-base64';
import { Link, useParams } from 'react-router-dom';
import * as Y from 'yjs';
import QuillCursors from 'quill-cursors';
import Cookies from 'js-cookie'; 

Quill.register('modules/cursors', QuillCursors);

type PropType = {
    ydoc: any;
    url_prefix: string;
    name: any;
    source: any;
};

const Edit = ({ ydoc, url_prefix, name, source }: PropType) => {
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
            if (data === null)
                return;
            
            await axios.post(
                `${url_prefix}/api/presence/${id}`,
                {   
                    session_id: Cookies.get('connect.sid'),
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

        source.addEventListener('presence', (e: any) => {
            const cursors = editor.getModule('cursors');
            const presence = JSON.parse(e.data);

            console.log(presence.cursor);

            const cursor_id = presence.session_id;

            if (presence.cursor.index == null) {
                cursors.removeCursor(cursor_id);
            }
            else {
                const colors = ['red', 'orange', 'green', 'blue', 'purple'];
                if (cursor_id !== Cookies.get('connect.sid')) {
                    cursors.createCursor(cursor_id, presence.name, colors[Math.floor(Math.random() * colors.length)])
                    cursors.moveCursor(cursor_id, presence.cursor);
                }
            }
        });
    }, []);

    const disconnect = async () => {
        ydoc.destroy();
        source.close();
    };

    const attachQuillRefs = () => {
        if (typeof quillRef.getEditor !== 'function') return;
        editor = quillRef.getEditor();
    };

    const modules = {
        cursors: true 
    };

    return (
        <div>
            <ReactQuill
                ref={(e) => {
                    quillRef = e;
                }}
                theme={'snow'}
                modules={modules}
            />
            <Link onClick={disconnect} to='/home'>
                Back to home
            </Link>
        </div>
    );
};

export default Edit;
