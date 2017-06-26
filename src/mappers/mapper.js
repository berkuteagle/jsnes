const romdata = Symbol('data');

export default class Mapper {
    constructor(data) {
        if (data instanceof Uint8Array) {
            this[romdata] = data;
        } else {
            throw Error('Data must be a Uint8Array type of.');
        }
    }

    read(address) {

    }

    write(address, value) {

    }
}