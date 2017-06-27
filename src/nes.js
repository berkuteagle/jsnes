import ROM from './rom.js';
import Memory, {MemoryBlock} from './memory.js';
import PPU from './ppu.js';

const rom = Symbol('rom');
const mem = Symbol('mem');
const vmem = Symbol('vmem');
const nesState = Symbol('nesState');
const ppu = Symbol('ppu');

const NES_STATE_INIT = 0;
const NES_STATE_LOAD = 1;
const NES_STATE_LOADED = 2;
const NES_STATE_LOAD_ERROR = 3;

const NES_RAM_SIZE = 2048;
const NES_VRAM_S_SIZE = 960;
const NES_VRAM_A_SIZE = 64;

export default class JSNES {
    constructor() {
        this[rom] = null;
        this[mem] = new Memory();
        this[vmem] = new Memory();

        let ram = new MemoryBlock(NES_RAM_SIZE);

        this[mem].register(ram, 0x0000, 0x07FF); //RAM
        this[mem].register(ram, 0x0800, 0x0FFF); //Mirror #1 of RAM
        this[mem].register(ram, 0x1000, 0x17FF); //Mirror #2 of RAM
        this[mem].register(ram, 0x1800, 0x1FFF); //Mirror #3 of RAM

        let vram = new MemoryBlock((NES_VRAM_S_SIZE + NES_VRAM_A_SIZE) * 2);

        this[vmem].register(vram, 0x2000, 0x27FF); //VRAM
        this[vmem].register(vram, 0x3000, 0x37FF); //Mirror of VRAM

        this[ppu] = new PPU(this[vmem]);

        this[mem].register(this[ppu], 0x2000, 0x2007);     //PPU

        let dma = this[ppu].getDMA(this[mem]);

        this[mem].register(dma, 0x4014, 0x4014); //DMA

        this[nesState] = NES_STATE_INIT;
    }

    static get version() {
        return '0.2.0';
    }

    get memory() {
        return this[mem];
    }

    get video() {
        return this[vmem];
    }

    get state() {
        return this[nesState];
    }

    loadROM(file) {
        let reader = new FileReader();
        let promise = new Promise((resolve, reject) => {
            reader.onload = function (event) {
                let buffer = new Uint8Array(event.target.result);
                try {
                    this[rom] = new ROM(buffer);
                } catch (err) {
                    this[nesState] = NES_STATE_LOAD_ERROR;
                    reject(err);
                }

                this[mem].register(this[rom].prg, 0x8000, 0xBFFF, true); //PRG_ROM #1
                this[mem].register(this[rom].prg, 0xC000, 0xFFFF, true); //PRG_ROM #2

                this[vmem].register(this[rom].chr, 0x0000, 0x0FFF, true); //CHR_ROM #1
                this[vmem].register(this[rom].chr, 0x1000, 0x1FFF, true); //CHR_ROM #2

                this[nesState] = NES_STATE_LOADED;
                resolve(buffer);
            }.bind(this)
        });

        this[nesState] = NES_STATE_LOAD;
        reader.readAsArrayBuffer(file);
        return promise;
    }
}
