import Mapper from './mapper';

export default class Mapper5 extends Mapper {
    constructor(nes) {
        super(nes);
        this._$name = 'Nintendo MMC5';
    }

    write(address, value) {
        // Writes to addresses other than MMC registers are handled by NoMapper.
        if (address < 0x5000) {
            super.write(address, value);
            return;
        }

        switch (address) {
            case 0x5100:
                this.prg_size = value & 3;
                break;
            case 0x5101:
                this.chr_size = value & 3;
                break;
            case 0x5102:
                this.sram_we_a = value & 3;
                break;
            case 0x5103:
                this.sram_we_b = value & 3;
                break;
            case 0x5104:
                this.graphic_mode = value & 3;
                break;
            case 0x5105:
                this.nametable_mode = value;
                this.nametable_type[0] = value & 3;
                this.load1kVromBank(value & 3, 0x2000);
                value >>= 2;
                this.nametable_type[1] = value & 3;
                this.load1kVromBank(value & 3, 0x2400);
                value >>= 2;
                this.nametable_type[2] = value & 3;
                this.load1kVromBank(value & 3, 0x2800);
                value >>= 2;
                this.nametable_type[3] = value & 3;
                this.load1kVromBank(value & 3, 0x2C00);
                break;
            case 0x5106:
                this.fill_chr = value;
                break;
            case 0x5107:
                this.fill_pal = value & 3;
                break;
            case 0x5113:
                this.SetBank_SRAM(3, value & 3);
                break;
            case 0x5114:
            case 0x5115:
            case 0x5116:
            case 0x5117:
                this.SetBank_CPU(address, value);
                break;
            case 0x5120:
            case 0x5121:
            case 0x5122:
            case 0x5123:
            case 0x5124:
            case 0x5125:
            case 0x5126:
            case 0x5127:
                this.chr_mode = 0;
                this.chr_page[0][address & 7] = value;
                this.SetBank_PPU();
                break;
            case 0x5128:
            case 0x5129:
            case 0x512A:
            case 0x512B:
                this.chr_mode = 1;
                this.chr_page[1][(address & 3) + 0] = value;
                this.chr_page[1][(address & 3) + 4] = value;
                this.SetBank_PPU();
                break;
            case 0x5200:
                this.split_control = value;
                break;
            case 0x5201:
                this.split_scroll = value;
                break;
            case 0x5202:
                this.split_page = value & 0x3F;
                break;
            case 0x5203:
                this.irq_line = value;
                this.nes.cpu.ClearIRQ();
                break;
            case 0x5204:
                this.irq_enable = value;
                this.nes.cpu.ClearIRQ();
                break;
            case 0x5205:
                this.mult_a = value;
                break;
            case 0x5206:
                this.mult_b = value;
                break;
            default:
                if (address >= 0x5000 && address <= 0x5015) {
                    this.nes.papu.exWrite(address, value);
                } else if (address >= 0x5C00 && address <= 0x5FFF) {
                    if (this.graphic_mode === 2) { 			// ExRAM
                        // vram write
                    } else if (this.graphic_mode !== 3) {		// Split,ExGraphic
                        if (this.irq_status & 0x40) {
                            // vram write
                        } else {
                            // vram write
                        }
                    }
                } else if (address >= 0x6000 && address <= 0x7FFF) {
                    if (this.sram_we_a === 2 && this.sram_we_b === 1) {
                        // additional ram write
                    }
                }
                break;
        }
    }

    loadROM(rom) {
        if (!this.nes.rom.valid) {
            alert('UNROM: Invalid ROM! Unable to load.');
            return;
        }

        // Load PRG-ROM:
        this.load8kRomBank(this.nes.rom.romCount * 2 - 1, 0x8000);
        this.load8kRomBank(this.nes.rom.romCount * 2 - 1, 0xA000);
        this.load8kRomBank(this.nes.rom.romCount * 2 - 1, 0xC000);
        this.load8kRomBank(this.nes.rom.romCount * 2 - 1, 0xE000);

        // Load CHR-ROM:
        this.loadCHRROM();

        // Do Reset-Interrupt:
        this.nes.cpu.requestIrq(this.nes.cpu.IRQ_RESET);
    }
}
