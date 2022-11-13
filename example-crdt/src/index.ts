import * as Y from 'yjs';
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';
import { fromUint8Array, toUint8Array } from 'js-base64';

class CRDTFormat {
    public bold?: Boolean = false;
    public italic?: Boolean = false;
    public underline?: Boolean = false;
}

exports.CRDT = class {
    cb: any;
    ydoc: any;
    ytext: any;
    currUpdate: any;

    constructor(cb: (update: string, isLocal: Boolean) => void) {
        ['update', 'insert', 'insertImage', 'delete', 'toHTML'].forEach(
            (f) => ((this as any)[f] = (this as any)[f].bind(this))
        );
        this.cb = cb;
        this.ydoc = new Y.Doc();
        this.ytext = this.ydoc.getText();
        this.ydoc.on('update', (update: any) => {
            this.currUpdate = JSON.stringify({
                update: fromUint8Array(update),
            });
        });
    }

    update(update: string) {
        const binaryEncoded = toUint8Array(update);
        Y.applyUpdate(this.ydoc, binaryEncoded);
        this.cb(update, false);
    }

    insert(index: number, content: string, format: CRDTFormat) {
        this.ytext.insert(index, content, format);
        this.cb(this.currUpdate, true);
    }

    insertImage(index: number, url: string) {
        this.ytext.insert(index, { image: url });
        this.cb(this.currUpdate, true);
    }

    delete(index: number, length: number) {
        this.ytext.delete(index, length);
        this.cb(this.currUpdate, true);
    }

    toHTML() {
        const delta = this.ytext.toDelta();
        const converter = new QuillDeltaToHtmlConverter(delta, {});
        const html = converter.convert();
        return html;
    }
};
