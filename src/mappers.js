import Mapper from './mappers/mapper.js';

const index = {
    0: Mapper
};

const names = {
    0: 'Direct Access',
    1: 'Nintendo MMC1',
    2: 'UNROM',
    3: 'CNROM',
    4: 'Nintendo MMC3',
    5: 'Nintendo MMC5',
    6: 'FFE F4xxx',
    7: 'AOROM',
    8: 'FFE F3xxx',
    9: 'Nintendo MMC2',
    10: 'Nintendo MMC4',
    11: 'Color Dreams Chip',
    12: 'FFE F6xxx',
    15: '100-in-1 switch',
    16: 'Bandai chip',
    17: 'FFE F8xxx',
    18: 'Jaleco SS8806 chip',
    19: 'Namcot 106 chip',
    20: 'Famicom Disk System',
    21: 'Konami VRC4a',
    22: 'Konami VRC2a',
    23: 'Konami VRC2a',
    24: 'Konami VRC6',
    25: 'Konami VRC4b',
    32: 'Irem G-101 chip',
    33: 'Taito TC0190/TC0350',
    34: '32kB ROM switch',
    64: 'Tengen RAMBO-1 chip',
    65: 'Irem H-3001 chip',
    66: 'GNROM switch',
    67: 'SunSoft3 chip',
    68: 'SunSoft4 chip',
    69: 'SunSoft5 FME-7 chip',
    71: 'Camerica chip',
    78: 'Irem 74HC161/32-based',
    91: 'Pirate HK-SF3 chip'
};

export default {
    getMapper(id) {
        return (index.hasOwnProperty(id)) ? index[id] : null;
    },

    getName(id) {
        return (names.hasOwnProperty(id)) ? names[id] : 'Unknown Mapper';
    },

    isMapperSupported(id) {
        return index.hasOwnProperty(id);
    }
}