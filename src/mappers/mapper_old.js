/*
 JSNES, based on Jamie Sanders' vNES
 Copyright (C) 2010 Ben Firshman

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import Utils from '../utils';

export default class Mapper {
    constructor(nes) {
        this.nes = nes;
        this._$name = 'Direct Access';
    }

    get name() {
        return this._$name;
    }

    reset() {
        this.joy1StrobeState = 0;
        this.joy2StrobeState = 0;
        this.joypadLastWrite = 0;

        this.mousePressed = false;
        this.mouseX = null;
        this.mouseY = null;
    }

    write(address, value) {
        if (address < 0x2000) {
            // Mirroring of RAM:
            this.nes.cpu.mem[address & 0x7FF] = value;
        }
        else if (address > 0x4017) {
            this.nes.cpu.mem[address] = value;
        }
        else if (address > 0x2007 && address < 0x4000) {
            this.regWrite(0x2000 + (address & 0x7), value);
        }
        else {
            this.regWrite(address, value);
        }
    }

    writelow(address, value) {
        if (address < 0x2000) {
            // Mirroring of RAM:
            this.nes.cpu.mem[address & 0x7FF] = value;
        }
        else if (address > 0x4017) {
            this.nes.cpu.mem[address] = value;
        }
        else if (address > 0x2007 && address < 0x4000) {
            this.regWrite(0x2000 + (address & 0x7), value);
        }
        else {
            this.regWrite(address, value);
        }
    };

    load(address) {
        // Wrap around:
        address &= 0xFFFF;

        // Check address range:
        if (address > 0x4017) {
            // ROM:
            return this.nes.cpu.mem[address];
        }
        else if (address >= 0x2000) {
            // I/O Ports.
            return this.regLoad(address);
        }
        else {
            // RAM (mirrored)
            return this.nes.cpu.mem[address & 0x7FF];
        }
    };

    regLoad(address) {
        switch (address >> 12) { // use fourth nibble (0xF000)
            case 0:
                break;

            case 1:
                break;

            case 2:
            // Fall through to case 3
            case 3:
                // PPU Registers
                switch (address & 0x7) {
                    case 0x0:
                        // 0x2000:
                        // PPU Control Register 1.
                        // (the value is stored both
                        // in main memory and in the
                        // PPU as flags):
                        // (not in the real NES)
                        return this.nes.cpu.mem[0x2000];

                    case 0x1:
                        // 0x2001:
                        // PPU Control Register 2.
                        // (the value is stored both
                        // in main memory and in the
                        // PPU as flags):
                        // (not in the real NES)
                        return this.nes.cpu.mem[0x2001];

                    case 0x2:
                        // 0x2002:
                        // PPU Status Register.
                        // The value is stored in
                        // main memory in addition
                        // to as flags in the PPU.
                        // (not in the real NES)
                        return this.nes.ppu.readStatusRegister();

                    case 0x3:
                        return 0;

                    case 0x4:
                        // 0x2004:
                        // Sprite Memory read.
                        return this.nes.ppu.sramLoad();
                    case 0x5:
                        return 0;

                    case 0x6:
                        return 0;

                    case 0x7:
                        // 0x2007:
                        // VRAM read:
                        return this.nes.ppu.vramLoad();
                }
                break;
            case 4:
                // Sound+Joypad registers
                switch (address - 0x4015) {
                    case 0:
                        // 0x4015:
                        // Sound channel enable, DMC Status
                        return this.nes.papu.readReg(address);

                    case 1:
                        // 0x4016:
                        // Joystick 1 + Strobe
                        return this.joy1Read();

                    case 2:
                        // 0x4017:
                        // Joystick 2 + Strobe
                        if (this.mousePressed) {

                            // Check for white pixel nearby:
                            let sx = Math.max(0, this.mouseX - 4);
                            let ex = Math.min(256, this.mouseX + 4);
                            let sy = Math.max(0, this.mouseY - 4);
                            let ey = Math.min(240, this.mouseY + 4);
                            let w = 0;

                            for (let y = sy; y < ey; y++) {
                                for (let x = sx; x < ex; x++) {

                                    if (this.nes.ppu.buffer[(y << 8) + x] == 0xFFFFFF) {
                                        w |= 0x1 << 3;
                                        console.debug('Clicked on white!');
                                        break;
                                    }
                                }
                            }

                            w |= (this.mousePressed ? (0x1 << 4) : 0);
                            return (this.joy2Read() | w) & 0xFFFF;
                        }
                        else {
                            return this.joy2Read();
                        }

                }
                break;
        }
        return 0;
    };

    regWrite(address, value) {
        switch (address) {
            case 0x2000:
                // PPU Control register 1
                this.nes.cpu.mem[address] = value;
                this.nes.ppu.updateControlReg1(value);
                break;

            case 0x2001:
                // PPU Control register 2
                this.nes.cpu.mem[address] = value;
                this.nes.ppu.updateControlReg2(value);
                break;

            case 0x2003:
                // Set Sprite RAM address:
                this.nes.ppu.writeSRAMAddress(value);
                break;

            case 0x2004:
                // Write to Sprite RAM:
                this.nes.ppu.sramWrite(value);
                break;

            case 0x2005:
                // Screen Scroll offsets:
                this.nes.ppu.scrollWrite(value);
                break;

            case 0x2006:
                // Set VRAM address:
                this.nes.ppu.writeVRAMAddress(value);
                break;

            case 0x2007:
                // Write to VRAM:
                this.nes.ppu.vramWrite(value);
                break;

            case 0x4014:
                // Sprite Memory DMA Access
                this.nes.ppu.sramDMA(value);
                break;

            case 0x4015:
                // Sound Channel Switch, DMC Status
                this.nes.papu.writeReg(address, value);
                break;

            case 0x4016:
                // Joystick 1 + Strobe
                if ((value & 1) === 0 && (this.joypadLastWrite & 1) === 1) {
                    this.joy1StrobeState = 0;
                    this.joy2StrobeState = 0;
                }
                this.joypadLastWrite = value;
                break;

            case 0x4017:
                // Sound channel frame sequencer:
                this.nes.papu.writeReg(address, value);
                break;

            default:
                // Sound registers
                // console.log("write to sound reg");
                if (address >= 0x4000 && address <= 0x4017) {
                    this.nes.papu.writeReg(address, value);
                }

        }
    };

    joy1Read() {
        let ret;

        switch (this.joy1StrobeState) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                ret = this.nes.keyboard.state1[this.joy1StrobeState];
                break;
            case 8:
            case 9:
            case 10:
            case 11:
            case 12:
            case 13:
            case 14:
            case 15:
            case 16:
            case 17:
            case 18:
                ret = 0;
                break;
            case 19:
                ret = 1;
                break;
            default:
                ret = 0;
        }

        this.joy1StrobeState++;
        if (this.joy1StrobeState === 24) {
            this.joy1StrobeState = 0;
        }

        return ret;
    };

    joy2Read() {
        let ret;

        switch (this.joy2StrobeState) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                ret = this.nes.keyboard.state2[this.joy2StrobeState];
                break;
            case 8:
            case 9:
            case 10:
            case 11:
            case 12:
            case 13:
            case 14:
            case 15:
            case 16:
            case 17:
            case 18:
                ret = 0;
                break;
            case 19:
                ret = 1;
                break;
            default:
                ret = 0;
        }

        this.joy2StrobeState++;
        if (this.joy2StrobeState === 24) {
            this.joy2StrobeState = 0;
        }

        return ret;
    };

    loadROM() {
        if (!this.nes.rom.valid || this.nes.rom.romCount < 1) {
            alert('NoMapper: Invalid ROM! Unable to load.');
            return;
        }

        // Load ROM into memory:
        this.loadPRGROM();

        // Load CHR-ROM:
        this.loadCHRROM();

        // Load Battery RAM (if present):
        this.loadBatteryRam();

        // Reset IRQ:
        //nes.getCpu().doResetInterrupt();
        this.nes.cpu.requestIrq(this.nes.cpu.IRQ_RESET);
    };

    loadPRGROM() {
        if (this.nes.rom.romCount > 1) {
            // Load the two first banks into memory.
            this.loadRomBank(0, 0x8000);
            this.loadRomBank(1, 0xC000);
        }
        else {
            // Load the one bank into both memory locations:
            this.loadRomBank(0, 0x8000);
            this.loadRomBank(0, 0xC000);
        }
    };

    loadCHRROM() {
        if (this.nes.rom.vromCount > 0) {
            if (this.nes.rom.vromCount === 1) {
                this.loadVromBank(0, 0x0000);
                this.loadVromBank(0, 0x1000);
            }
            else {
                this.loadVromBank(0, 0x0000);
                this.loadVromBank(1, 0x1000);
            }
        }
    };

    loadBatteryRam() {
        if (this.nes.rom.batteryRam) {
            let ram = this.nes.rom.batteryRam;
            if (ram !== null && ram.length == 0x2000) {
                // Load Battery RAM into memory:
                Utils.copyArrayElements(ram, 0, this.nes.cpu.mem, 0x6000, 0x2000);
            }
        }
    };

    loadRomBank(bank, address) {
        // Loads a ROM bank into the specified address.
        bank %= this.nes.rom.romCount;
        //var data = this.nes.rom.rom[bank];
        //cpuMem.write(address,data,data.length);
        Utils.copyArrayElements(this.nes.rom.rom[bank], 0, this.nes.cpu.mem, address, 16384);
    };

    loadVromBank(bank, address) {
        if (this.nes.rom.vromCount === 0) {
            return;
        }
        this.nes.ppu.triggerRendering();

        Utils.copyArrayElements(this.nes.rom.vrom[bank % this.nes.rom.vromCount],
            0, this.nes.ppu.vramMem, address, 4096);

        let vromTile = this.nes.rom.vromTile[bank % this.nes.rom.vromCount];
        Utils.copyArrayElements(vromTile, 0, this.nes.ppu.ptTile, address >> 4, 256);
    };

    load32kRomBank(bank, address) {
        this.loadRomBank((bank * 2) % this.nes.rom.romCount, address);
        this.loadRomBank((bank * 2 + 1) % this.nes.rom.romCount, address + 16384);
    };

    load8kVromBank(bank4kStart, address) {
        if (this.nes.rom.vromCount === 0) {
            return;
        }
        this.nes.ppu.triggerRendering();

        this.loadVromBank((bank4kStart) % this.nes.rom.vromCount, address);
        this.loadVromBank((bank4kStart + 1) % this.nes.rom.vromCount,
            address + 4096);
    };

    load1kVromBank(bank1k, address) {
        if (this.nes.rom.vromCount === 0) {
            return;
        }
        this.nes.ppu.triggerRendering();

        let bank4k = Math.floor(bank1k / 4) % this.nes.rom.vromCount;
        let bankoffset = (bank1k % 4) * 1024;
        Utils.copyArrayElements(this.nes.rom.vrom[bank4k], 0,
            this.nes.ppu.vramMem, bankoffset, 1024);

        // Update tiles:
        let vromTile = this.nes.rom.vromTile[bank4k];
        let baseIndex = address >> 4;
        for (let i = 0; i < 64; i++) {
            this.nes.ppu.ptTile[baseIndex + i] = vromTile[((bank1k % 4) << 6) + i];
        }
    };

    load2kVromBank(bank2k, address) {
        if (this.nes.rom.vromCount === 0) {
            return;
        }
        this.nes.ppu.triggerRendering();

        let bank4k = Math.floor(bank2k / 2) % this.nes.rom.vromCount;
        let bankoffset = (bank2k % 2) * 2048;
        Utils.copyArrayElements(this.nes.rom.vrom[bank4k], bankoffset,
            this.nes.ppu.vramMem, address, 2048);

        // Update tiles:
        let vromTile = this.nes.rom.vromTile[bank4k];
        let baseIndex = address >> 4;
        for (let i = 0; i < 128; i++) {
            this.nes.ppu.ptTile[baseIndex + i] = vromTile[((bank2k % 2) << 7) + i];
        }
    };

    load8kRomBank(bank8k, address) {
        let bank16k = Math.floor(bank8k / 2) % this.nes.rom.romCount;
        let offset = (bank8k % 2) * 8192;

        //this.nes.cpu.mem.write(address,this.nes.rom.rom[bank16k],offset,8192);
        Utils.copyArrayElements(this.nes.rom.rom[bank16k], offset,
            this.nes.cpu.mem, address, 8192);
    };

    clockIrqCounter() {
        // Does nothing. This is used by the MMC3 mapper.
    };

    latchAccess(address) {
        // Does nothing. This is used by MMC2.
    };

    toJSON() {
        return {
            'joy1StrobeState': this.joy1StrobeState,
            'joy2StrobeState': this.joy2StrobeState,
            'joypadLastWrite': this.joypadLastWrite
        };
    };

    fromJSON(s) {
        this.joy1StrobeState = s.joy1StrobeState;
        this.joy2StrobeState = s.joy2StrobeState;
        this.joypadLastWrite = s.joypadLastWrite;
    };
}
