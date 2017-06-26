import Mapper from './mapper_old';

export default class Mapper34 extends Mapper {
    constructor(nes) {
        super(nes);
        this._$name = '32kB ROM switch';
    }

    write(address, value) {
        if (address < 0x8000) {
            super.write(address, value);
            return;
        } else {
            this.load32kRomBank(value, 0x8000);
        }
    }
}
