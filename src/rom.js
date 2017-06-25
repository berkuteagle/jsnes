import {PPUTile} from './ppu.js';

const ROM_PRG_BANK_SIZE = 16384;
const ROM_CHR_BANK_SIZE = 4096;

export const VERTICAL_MIRRORING = 0;
export const HORIZONTAL_MIRRORING = 1;
export const FOURSCREEN_MIRRORING = 2;
export const SINGLESCREEN_MIRRORING = 3;
export const SINGLESCREEN_MIRRORING2 = 4;
export const SINGLESCREEN_MIRRORING3 = 5;
export const SINGLESCREEN_MIRRORING4 = 6;
export const CHRROM_MIRRORING = 7;

export default class ROM {
    constructor(buffer) {
        if (buffer instanceof Uint8Array) {
            if (buffer.length > 16) {
                this._$buffer = buffer.slice(16);
                this._$header = new ROMHeader(buffer.slice(0, 16));
            } else {
                throw Error('ROM file is corrupt!');
            }

            if (this._$buffer.length < (this._$header.romCount * ROM_PRG_BANK_SIZE + this._$header.vromCount * ROM_CHR_BANK_SIZE)) {
                throw Error('ROM file is corrupt!');
            } else {
                this._$prg = new ROMBanks(this._$header.romCount, ROM_PRG_BANK_SIZE, this._$buffer);
                this._$chr = new ROMBanks(this._$header.vromCount, ROM_CHR_BANK_SIZE, this._$buffer.slice(this._$prg.size));

                this._$tiles = new Array(this._$header.vromCount);
                for (let i = 0; i < this._$header.vromCount; i++) {
                    this._$tiles[i] = new Array(256);
                    for (let j = 0; j < 256; j++) {
                        this._$tiles[i][j] = new PPUTile();
                    }
                }

                this._$chr.banks.forEach((bank, id) => {
                    bank.forEach((byte, seek) => {
                        let tileIndex = seek >> 4;
                        let leftOver = seek % 16;
                        if (leftOver < 8) {
                            this._$tiles[id][tileIndex].setScanline(
                                leftOver,
                                byte,
                                bank[seek + 8]
                            );
                        }
                        else {
                            this._$tiles[id][tileIndex].setScanline(
                                leftOver - 8,
                                bank[seek - 8],
                                byte
                            );
                        }
                    });
                });
            }
        } else {
            throw Error('Buffer must be a Uint8Array of type.');
        }
    }

    get prg() {
        return this._$prg;
    }

    get chr() {
        return this._$chr;
    }
}

class ROMHeader {
    constructor(buffer) {
        this._$header = buffer;
    }

    get isValid() {
        return new TextDecoder("utf-8").decode(this._$header.slice(0, 4)) === 'NES\x1a';
    }

    get romCount() {
        return this._$header[4];
    }

    get vromCount() {
        return this._$header[5] * 2;
    }

    get mirroring() {
        return ((this._$header[6] & 1) !== 0 ? 1 : 0);
    }

    get batteryRam() {
        return (this._$header[6] & 2) !== 0
    }

    get trainer() {
        return (this._$header[6] & 4) !== 0;
    }

    get fourScreen() {
        return (this._$header[6] & 8) !== 0;
    }

    get mapperType() {
        return (this._$header.slice(8, 16).some(b => {
            return b
        }))
            ? (this._$header[6] >> 4)
            : (this._$header[6] >> 4) | (this._$header[7] & 0xF0);
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

class ROMBanks {
    constructor(count, banksize, buffer) {
        let arr = new Array(count);
        arr.fill(undefined);

        this._$banks = arr.map((bank, id) => {
            return new Uint8Array(buffer.slice(id * banksize, (1 + id) * banksize));
        })
    }

    get banks() {
        return this._$banks;
    }

    get size() {
        return this._$banks.length * this._$banks[0].length;
    }

    get bankSize() {
        return this._$banks[0].length;
    }

    get bankCount() {
        return this._$banks.length;
    }
}