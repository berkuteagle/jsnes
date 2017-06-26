import Mapper from './mapper_old';

export default class Mapper7 extends Mapper {
    constructor(nes) {
        super(nes);
        this._$name = 'AOROM';
    }

    write(address, value) {
        // Writes to addresses other than MMC registers are handled by NoMapper.
        if (address < 0x8000) {
            super.write(address, value);
        } else {
            this.load32kRomBank(value & 0x7, 0x8000);
            if (value & 0x10) {
                this.nes.ppu.setMirroring(this.nes.rom.SINGLESCREEN_MIRRORING2);
            } else {
                this.nes.ppu.setMirroring(this.nes.rom.SINGLESCREEN_MIRRORING);
            }
        }
    }

    loadROM(rom) {
        if (!this.nes.rom.valid) {
            alert('AOROM: Invalid ROM! Unable to load.');
            return;
        }

        // Load PRG-ROM:
        this.loadPRGROM();

        // Load CHR-ROM:
        this.loadCHRROM();

        // Do Reset-Interrupt:
        this.nes.cpu.requestIrq(this.nes.cpu.IRQ_RESET);
    }
}
