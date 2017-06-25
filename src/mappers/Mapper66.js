import Mapper from './mapper';

export default class Mapper66 extends Mapper {
    constructor(nes) {
        super(nes);
        this._$name = 'GNROM switch';
    }

    write(address, value) {
        if (address < 0x8000) {
            super.write(address, value);
            return;
        } else {
            // Swap in the given PRG-ROM bank at 0x8000:
            this.load32kRomBank((value >> 4) & 3, 0x8000);

            // Swap in the given VROM bank at 0x0000:
            this.load8kVromBank((value & 3) * 2, 0x0000);
        }
    }
}
