const axios = require('axios');
const Y = require('yjs');
const toUint8Array = require('js-base64').toUint8Array;
const fromUint8Array = require('js-base64').fromUint8Array;
const EventSource = require("eventsource")
const QuillDeltaToHtmlConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter

var id;

class CRDT {

    constructor(cb) {
        ['update', 'insert', 'insertImage', 'delete', 'toHTML'].forEach(
            (f) => (this[f] = this[f].bind(this))
        );
        this.cb = cb;
        this.ydoc = new Y.Doc();
        this.ytext = this.ydoc.getText('quill');
        this.ydoc.on('update', (update, origin) => {
            console.log('uint8: ', update);
            const newUpdate = JSON.stringify({
                update: fromUint8Array(update),
            });
            console.log('stringified: ', newUpdate);
            if (origin === 'external') {
                this.cb(newUpdate, false);
            }
            else {
                this.cb(newUpdate, true);
            }
        });
    }

    update(update) {
        const binaryEncoded = toUint8Array(update);
        Y.applyUpdate(this.ydoc, binaryEncoded, 'external');
    }

    insert(index, content, format) {
        this.ytext.insert(index, content, format);
    }

    insertImage(index, url) {
        this.ytext.insertEmbed(index, { image: url });
    }

    delete(index, length) {
        this.ytext.delete(index, length);
    }

    toHTML() {
        const delta = this.ytext.toDelta();
        const converter = new QuillDeltaToHtmlConverter(delta, {});
        const html = converter.convert();
        return html;
    }
};

async function updateCb(update, isLocal) {
    if (isLocal) {
        const response = await axios.post(
            `http://bkmj.cse356.compas.cs.stonybrook.edu/api/op/${id}`,
            update,
            { 'Content-Type': 'application/json', withCredentials: true }
        );
    }
}

async function main() {

    const auth = await axios.post(
        `http://bkmj.cse356.compas.cs.stonybrook.edu/authenticate`,
        { name: 'hello' },
        { withCredentials: true }
    );
    console.log(auth.data);

    const response = await axios.post(
        `http://bkmj.cse356.compas.cs.stonybrook.edu/collection/create`,
        { name: 'hello' },
        { withCredentials: true }
    );
    id = response.data.id;
    console.log(id);
    
    const eventSource = new EventSource(`http://bkmj.cse356.compas.cs.stonybrook.edu/api/connect/${id}`, {
        withCredentials: true,
    });
    
    eventSource.addEventListener('sync', (e) => {

        const myCRDT = new CRDT(updateCb);
        myCRDT.update(e.data);
        
        console.log('crdt: ', myCRDT.toHTML());

        myCRDT.insert(0, 'hello');
    });
}

main().then(() => {
    console.log('waiting...');
    // process.exit();
});