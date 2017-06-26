import Mapper from './mapper_old';

export default class Mapper2 extends Mapper {
    constructor(nes) {
        super(nes);
        this._$name = 'UNROM';
    }

    write(address, value) {
        if (address < 0x8000) {
            super.write(address, value);
        } else {
            this.loadRomBank(value, 0x8000);
        }
    }

    loadROM(rom) {
        if (!this.nes.rom.valid) {
            alert('UNROM: Invalid ROM! Unable to load.');
            return;
        }

        // Load PRG-ROM:
        this.loadRomBank(0, 0x8000);
        this.loadRomBank(this.nes.rom.romCount - 1, 0xC000);

        // Load CHR-ROM:
        this.loadCHRROM();

        // Do Reset-Interrupt:
        this.nes.cpu.requestIrq(this.nes.cpu.IRQ_RESET);
    }
}
