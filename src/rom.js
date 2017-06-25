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

export const VERTICAL_MIRRORING = 0;
export const HORIZONTAL_MIRRORING = 1;
export const FOURSCREEN_MIRRORING = 2;
export const SINGLESCREEN_MIRRORING = 3;
export const SINGLESCREEN_MIRRORING2 = 4;
export const SINGLESCREEN_MIRRORING3 = 5;
export const SINGLESCREEN_MIRRORING4 = 6;
export const CHRROM_MIRRORING = 7;

export default class ROM {
    constructor(nes) {

        this.header = null;
        this.rom = null;
        this.vrom = null;
        this.vromTile = null;

        this.romCount = null;
        this.vromCount = null;
        this.mirroring = null;
        this.batteryRam = null;
        this.trainer = null;
        this.fourScreen = null;
        this.mapperType = null;
        this.valid = false;

        this.nes = nes;
    }

    load(data) {
        let foundError = false;
        let offset = 16;
        let tileIndex;
        let leftOver;

        if (data.indexOf('NES\x1a') === -1) {
            this.nes.ui.updateStatus('Not a valid NES ROM.');
            return;
        }
        this.header = new Array(16);
        for (let i = 0; i < 16; i++) {
            this.header[i] = data.charCodeAt(i) & 0xFF;
        }
        this.romCount = this.header[4];
        this.vromCount = this.header[5] * 2; // Get the number of 4kB banks, not 8kB
        this.mirroring = ((this.header[6] & 1) !== 0 ? 1 : 0);
        this.batteryRam = (this.header[6] & 2) !== 0;
        this.trainer = (this.header[6] & 4) !== 0;
        this.fourScreen = (this.header[6] & 8) !== 0;
        this.mapperType = (this.header[6] >> 4) | (this.header[7] & 0xF0);
        // Check whether byte 8-15 are zero's:

        for (let i = 8; i < 16; i++) {
            if (this.header[i] !== 0) {
                foundError = true;
                break;
            }
        }
        if (foundError) {
            this.mapperType &= 0xF; // Ignore byte 7
        }
        // Load PRG-ROM banks:
        this.rom = new Array(this.romCount);

        for (let i = 0; i < this.romCount; i++) {
            this.rom[i] = new Array(16384);
            for (let j = 0; j < 16384; j++) {
                if (offset + j >= data.length) {
                    break;
                }
                this.rom[i][j] = data.charCodeAt(offset + j) & 0xFF;
            }
            offset += 16384;
        }
        // Load CHR-ROM banks:
        this.vrom = new Array(this.vromCount);
        for (let i = 0; i < this.vromCount; i++) {
            this.vrom[i] = new Array(4096);
            for (let j = 0; j < 4096; j++) {
                if (offset + j >= data.length) {
                    break;
                }
                this.vrom[i][j] = data.charCodeAt(offset + j) & 0xFF;
            }
            offset += 4096;
        }

        // Create VROM tiles:
        this.vromTile = new Array(this.vromCount);
        for (let i = 0; i < this.vromCount; i++) {
            this.vromTile[i] = new Array(256);
            for (let j = 0; j < 256; j++) {
                this.vromTile[i][j] = new JSNES.PPU.Tile();
            }
        }

        // Convert CHR-ROM banks to tiles:
        for (let v = 0; v < this.vromCount; v++) {
            for (let i = 0; i < 4096; i++) {
                tileIndex = i >> 4;
                leftOver = i % 16;
                if (leftOver < 8) {
                    this.vromTile[v][tileIndex].setScanline(
                        leftOver,
                        this.vrom[v][i],
                        this.vrom[v][i + 8]
                    );
                }
                else {
                    this.vromTile[v][tileIndex].setScanline(
                        leftOver - 8,
                        this.vrom[v][i - 8],
                        this.vrom[v][i]
                    );
                }
            }
        }

        this.valid = true;
    }

    getMirroringType() {
        if (this.fourScreen) {
            return FOURSCREEN_MIRRORING;
        }
        if (this.mirroring === 0) {
            return HORIZONTAL_MIRRORING;
        }
        return VERTICAL_MIRRORING;
    }
}
