import Memory, {MemoryBlock} from './memory.js';

const mem = Symbol('mem');
const vmem = Symbol('vmem');
const smem = Symbol('smem');
const regs = Symbol('regs');
const flags = Symbol('flags');

export default class PPU {
    constructor(mem) {
        if (mem instanceof Memory) {
            this[vmem] = mem;
        } else {
            throw Error('Mem must be Memory type of.');
        }

        this[smem] = new MemoryBlock(0xFF);

        this[regs] = {
            VS: 0x0,  //Vertical scroll
            HS: 0x0,  //Horizontal scroll
            SA: 0x0,  //Sprite address
            MH: 0x0,  //Video memory address H
            ML: 0x0,  //Video memory address L
            MB: 0x0,  //Video memory read buffer
            SR: 0x0,  //PPU status
            CR0: 0x0, //PPU control 0
            CR1: 0x0  //PPU control 1
        };

        this[flags] = {
            SS: false, //Set scroll flag
            MM: false  //Memory access flag
        }
    }

    getDMA(mem) {
        return new DMA(mem, this[smem]);
    }

    read(address) {
        let result;
        switch (address) {
            case 0x2: //Read state
                result = this[regs].SR;
                this[regs].SR &= ~0xc0;
                break;
            case 0x4: //Read from sprite memory
                result = this[smem].read(this[regs].SA++);
                this[regs].SA &= 0xFF;
                break;
            case 0x7: //Read from video memory
                result = this[regs].MB;
                this[regs].MB = this[vmem].read(this[regs].MH << 8 | this[regs].ML);
                this[regs].ML += this[regs].CR0 >> 2 & 1 ? 1 : 32;
                this[regs].MH += this[regs].ML >> 8;
                this[regs].ML &= 0xFF;
                this[regs].MH &= 0xFF;
                break;
            default:
                result = 0x0;
                console.info(`Not allow read from address [0x${('0000' + address.toString(16)).slice(-4)}]`);
        }
        return result;
    }

    write(address, value) {
        value = value & 0xFF;
        switch (address) {
            case 0x0: //Set control register [CR0]
                this[regs].CR0 = value & ~0x40;
                break;
            case 0x1: //Set control register [CR1]
                this[regs].CR1 = value;
                break;
            case 0x3: //Set address for access to sprite memory [SA]
                this[regs].SA = value;
                break;
            case 0x4: //Write to sprite memory
                this[smem].write(this[regs].SA++, value);
                this[regs].SA &= 0xFF;
                break;
            case 0x5: //Set absolute scrolling values [VS,HS]
                this[flags].SS ? this[regs].HS = value : this[regs].VS = value;
                this[flags].SS = !this[flags].SS;
                break;
            case 0x6: //Set address for access to video memory [MH,ML]
                this[flags].MM ? this[regs].ML = value : this[regs].MH = value;
                this[flags].MM = !this[flags].MM;
                break;
            case 0x7: //Write to video memory
                this[vmem].write(this[regs].MH << 8 | this[regs].ML, value);
                this[regs].ML += this[regs].CR0 >> 2 & 1 ? 1 : 32;
                this[regs].MH += this[regs].ML >> 8;
                this[regs].ML &= 0xFF;
                this[regs].MH &= 0xFF;
                break;
            default:
                console.info(`Not allow write to address [0x${('0000' + address.toString(16)).slice(-4)}]`);
        }
    }
}

class DMA {
    constructor(memory, sprites) {
        if (memory && sprites) {
            this[mem] = memory;
            this[smem] = sprites;
            this[regs] = {
                AH: 0x0
            };
        } else {
            throw Error('All parameters required.');
        }
    }

    read() {
        return this[regs].AH;
    }

    write(address, value) {
        this[regs].AH = value & 0xFF;
        for (let i = 0x0; i < 0xFF; ++i) this[smem].write(i, this[mem].read(this[regs].AH << 8 | i) || 0x0);
    }
}