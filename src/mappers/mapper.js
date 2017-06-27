const romData = Symbol('romData');

export default class Mapper {
    constructor(data) {
        if (data instanceof Uint8Array) {
            this[romData] = data;
        } else {
            throw Error('Data must be a Uint8Array type of.');
        }
    }

    readPRG(address) {
        console.log(`readPRG: from [0x${('0000' + address.toString(16)).slice(-4)}]`);
        return 0x1
    }

    writePRG(address, value) {
        console.log(`writePRG: ${value} to [0x${('0000' + address.toString(16)).slice(-4)}]`);
    }

    readCHR(address) {
        console.log(`readCHR: from [0x${('0000' + address.toString(16)).slice(-4)}]`);
        return 0x2
    }

    writeCHR(address, value) {
        console.log(`writeCHR: ${value} to [0x${('0000' + address.toString(16)).slice(-4)}]`);
    }
}