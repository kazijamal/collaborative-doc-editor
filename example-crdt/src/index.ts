import * as Y from 'yjs';
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';
import { toUint8Array } from 'js-base64';

class CRDTFormat {
    public bold?: Boolean = false;
    public italic?: Boolean = false;
    public underline?: Boolean = false;
}

exports.CRDT = class {
    cb: any;
    ydoc: any;
    ytext: any;

    constructor(cb: (update: string, isLocal: Boolean) => void) {
        ['update', 'insert', 'delete', 'toHTML'].forEach(
            (f) => ((this as any)[f] = (this as any)[f].bind(this))
        );
        this.cb = cb;
        this.ydoc = new Y.Doc();
        this.ytext = this.ydoc.getText();

        // testing update
        // const diffdoc = new Y.Doc();
        // const difftext = diffdoc.getText();
        // difftext.insert(0, 'feskofmesklfmesklfm', { bold: true });
        // const diff = Y.encodeStateAsUpdate(diffdoc);
        // const base64Encoded = fromUint8Array(diff);
        // this.update(base64Encoded);
    }

    update(update: string) {
        const binaryEncoded = toUint8Array(update);
        Y.applyUpdate(this.ydoc, binaryEncoded);
        this.cb(update, false);
    }

    insert(index: number, content: string, format: CRDTFormat) {
        this.ytext.insert(index, content, format);
        this.cb(`insert ${content} at index ${index}`, true);
    }

    delete(index: number, length: number) {
        this.ytext.delete(index, length);
        this.cb(`delete at index ${index}`, true);
    }

    toHTML() {
        const delta = this.ytext.toDelta();
        const converter = new QuillDeltaToHtmlConverter(delta, {});
        const html = converter.convert();
        return html;
    }
};
