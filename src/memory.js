const ranges = Symbol('ranges');
const rangeH = Symbol('rangeHandler');
const objectByAddress = Symbol('rangeByAddress');
const data = Symbol('data');

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

    register(object, start, end, absolute) {
        if (this[objectByAddress](start) || this[objectByAddress](end)) {
            throw Error('Range for this addresses is already registered.');
        } else {
            this[ranges].set({start: start, end: end, absolute: absolute || false}, object);
        }
    }

    [rangeH](action, address, value) {
        let handler = this[objectByAddress](address);
        if (handler) {
            if (typeof handler.object[action] === 'function') {
                return handler.object[action](address - (handler.range.absolute ? 0 : handler.range.start), value);
            } else {
                console.info(`Method ${action} not implemented for this range.`);
            }
        } else {
            console.info(`Range for address [0x${('0000' + address.toString(16)).slice(-4)}] not registered.`);
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
        this[data] = new Uint8Array(size);
        this[data].fill(0x0);
    }

    read(address) {
        if (address > this[data].length) {
            console.info('Out of memory');
            return 0x0;
        } else {
            return this[data][address];
        }
    }

    write(address, value) {
        if (address > this[data].length) {
            console.info('Out of memory');
        } else {
            this[data][address] = value & 0xFF;
        }
    }
}