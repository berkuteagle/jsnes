import Mapper from './mapper_old';

export default class Mapper11 extends Mapper {
    constructor(nes) {
        super(nes);
        this._$name = 'Color Dreams Chip';
    }

    write(address, value) {
        if (address < 0x8000) {
            super.write(address, value);
            return;
        } else {
            // Swap in the given PRG-ROM bank:
            let prgbank1 = ((value & 0xF) * 2) % this.nes.rom.romCount;
            let prgbank2 = ((value & 0xF) * 2 + 1) % this.nes.rom.romCount;

            this.loadRomBank(prgbank1, 0x8000);
            this.loadRomBank(prgbank2, 0xC000);


            if (this.nes.rom.vromCount > 0) {
                // Swap in the given VROM bank at 0x0000:
                let bank = ((value >> 4) * 2) % (this.nes.rom.vromCount);
                this.loadVromBank(bank, 0x0000);
                this.loadVromBank(bank + 1, 0x1000);
            }
        }
    }
}
