import JSNES from './nes.js';

const nes = new JSNES();

window.nes = nes;

document.getElementById('file').addEventListener('change', function (event) {
    let file = event.target.files[0];

    nes.loadROM(file)
        .then(result => {
            console.info(result);
        })
        .catch(err => {
            console.error(err);
        });
}, false);