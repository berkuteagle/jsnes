const ranges = Symbol('ranges');
const rangeH = Symbol('rangeHandler');
const objectByAddress = Symbol('rangeByAddress');
const memory = Symbol('memory');

export default class Memory {
    constructor() {
        this[ranges] = new Map();
    }

    read(address) {
        return this[rangeH]('read', address);
    }

    write(address, value) {
        return this[rangeH]('write', address, value);
    }

    register(object, start, end) {
        if (this[objectByAddress](start) || this[objectByAddress](end)) {
            throw Error('Range for this addresses is already registered.');
        } else {
            this[ranges].set({start: start, end: end}, object);
        }
    }

    [rangeH](action, address, param) {
        let handler = this[objectByAddress](address);
        if (handler) {
            if (typeof handler.object[action] === 'function') {
                return handler.object[action](address - handler.range.start, param);
            } else {
                throw Error(`Method ${action} not implemented for this range.`);
            }
        } else {
            throw Error('Range for this address not registered.');
        }
    }

    [objectByAddress](address) {
        let result = null;
        this[ranges].forEach((object, range) => {
            if (!result) {
                result = (address >= range.start && address <= range.end) ? {
                    object: object,
                    range: range
                } : null;
            }
        }, this);
        return result;
    }
}

export class MemoryBlock {
    constructor(size) {
        this[memory] = new Uint8Array(size);
        this[memory].fill(0x0);
    }

    read(address) {
        if (address > this[memory].length) {
            throw Error('Out of memory');
        } else {
            return this[memory][address];
        }
    }

    write(address, value) {
        if (address > this[memory].length) {
            throw Error('Out of memory');
        } else {
            return this[memory][address] = value > 0xFF ? 0xFF : value;
        }
    }
}