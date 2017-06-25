import ROM from './rom.js';

export default class JSNES {
    constructor() {
        this._version = '0.2.0';

        this._$rom = null;
    }

    loadROM(file) {
        let reader = new FileReader();
        let promise = new Promise(resolve => {
            reader.onload = function (event) {
                let buffer = new Uint8Array(event.target.result);
                this._$rom = new ROM(buffer);
                resolve(buffer);
            }.bind(this)
        });

        reader.readAsArrayBuffer(file);
        return promise;
    }
}
