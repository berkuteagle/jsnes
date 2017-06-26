import MappersManager from './mappers.js';

const MINIMAL_ROM_SIZE = 24592;

const ROM_PRG_WIN_SIZE = 16384;
const ROM_CHR_WIN_SIZE = 4096;

export const VERTICAL_MIRRORING = 0;
export const HORIZONTAL_MIRRORING = 1;
export const FOURSCREEN_MIRRORING = 2;
export const SINGLESCREEN_MIRRORING = 3;
export const SINGLESCREEN_MIRRORING2 = 4;
export const SINGLESCREEN_MIRRORING3 = 5;
export const SINGLESCREEN_MIRRORING4 = 6;
export const CHRROM_MIRRORING = 7;

const data = Symbol('data');
const header = Symbol('header');
const prg = Symbol('prg');
const chr = Symbol('chr');
const mapper = Symbol('mapper');

export default class ROM {
    constructor(buffer) {
        let tDecoder = new TextDecoder('utf-8');
        if (buffer.length >= MINIMAL_ROM_SIZE && tDecoder.decode(buffer.slice(0, 4)) === 'NES\x1a') {
            this[header] = buffer.slice(0, 16);

            let mapperConstructor = MappersManager.getMapper(this.header.mapperType);
            if (!mapperConstructor) {
                throw Error(`Mapper ${MappersManager.getName(this.header.mapperType)}[${this.header.mapperType}] not supported.`);
            } else {
                this[mapper] = new mapperConstructor(buffer.slice(16));
            }
        } else {
            throw Error('ROM file is corrupt!');
        }
    }

    get header() {
        return new ROMHeader(this[header]);
    }

    read(address) {
        if (this[mapper]) {
            return this[mapper].read(address);
        } else {
            throw Error('Mapper is not defined.')
        }
    }

    write(address, value) {
        if (this[mapper]) {
            return this[mapper].write(address, value);
        } else {
            throw Error('Mapper is not defined.')
        }
    }
}

class ROMHeader {
    constructor(buffer) {
        this[data] = buffer;
    }

    get isValid() {
        return new TextDecoder("utf-8").decode(this[data].slice(0, 4)) === 'NES\x1a';
    }

    get romCount() {
        return this[data][4];
    }

    get vromCount() {
        return this[data][5] * 2;
    }

    get mirroring() {
        return ((this[data][6] & 1) !== 0 ? 1 : 0);
    }

    get batteryRam() {
        return (this[data][6] & 2) !== 0
    }

    get trainer() {
        return (this[data][6] & 4) !== 0;
    }

    get fourScreen() {
        return (this[data][6] & 8) !== 0;
    }

    get mapperType() {
        return (this[data].slice(8, 16).some(b => {
            return b
        }))
            ? (this[data][6] >> 4)
            : (this[data][6] >> 4) | (this[data][7] & 0xF0);
    }

    get mirroringType() {
        if (this.fourScreen) {
            return FOURSCREEN_MIRRORING;
        }
        if (this.mirroring === 0) {
            return HORIZONTAL_MIRRORING;
        }
        return VERTICAL_MIRRORING;
    }
}