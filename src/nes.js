import ROM from './rom.js';
import Memory, {MemoryBlock} from './memory.js';

const rom = Symbol('rom');
const ram = Symbol('ram');
const vram1 = Symbol('vram1');
const vram2 = Symbol('vram2');
const mem = Symbol('mem');
const vmem = Symbol('vmem');
const state = Symbol('state');

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

        this[ram] = new MemoryBlock(NES_RAM_SIZE);

        this[mem].register(this[ram], 0x0000, 0x07FF); //RAM
        this[mem].register(this[ram], 0x0800, 0x0FFF); //Mirror #1 of RAM
        this[mem].register(this[ram], 0x1000, 0x17FF); //Mirror #2 of RAM
        this[mem].register(this[ram], 0x1800, 0x1FFF); //Mirror #3 of RAM

        this[vram1] = new MemoryBlock(NES_VRAM_S_SIZE + NES_VRAM_A_SIZE);
        this[vram2] = new MemoryBlock(NES_VRAM_S_SIZE + NES_VRAM_A_SIZE);

        this[vmem].register(this[vram1],0x2000, 0x23FF); //VRAM #1
        this[vmem].register(this[vram2],0x2400, 0x27FF); //VRAM #2
        this[vmem].register(this[vram1],0x3000, 0x33FF); //Mirror of VRAM #1
        this[vmem].register(this[vram2],0x3400, 0x37FF); //Mirror of VRAM #2

        this[state] = NES_STATE_INIT;
    }

    get version() {
        return '0.2.0';
    }

    get memory() {
        return this[mem];
    }

    get video() {
        return this[vmem];
    }

    get state() {
        return this[state];
    }

    loadROM(file) {
        let reader = new FileReader();
        let promise = new Promise((resolve, reject) => {
            reader.onload = function (event) {
                let buffer = new Uint8Array(event.target.result);
                try {
                    this[rom] = new ROM(buffer);
                } catch (err) {
                    this[state] = NES_STATE_LOAD_ERROR;
                    reject(err);
                }
                this[state] = NES_STATE_LOADED;
                resolve(buffer);
            }.bind(this)
        });

        this[state] = NES_STATE_LOAD;
        reader.readAsArrayBuffer(file);
        return promise;
    }
}
