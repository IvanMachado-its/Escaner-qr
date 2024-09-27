const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 8080;

function loadQRCodes() {
    const data = fs.readFileSync('qrcodes.json', 'utf8');
    return JSON.parse(data);
}

function saveQRCodes(qrCodes) {
    fs.writeFileSync('qrcodes.json', JSON.stringify(qrCodes, null, 2));
}

app.get('/qrcodes', (req, res) => {
    const qrCodes = loadQRCodes();
    const usedQRCodes = qrCodes.filter(qrCode => qrCode.used);
    res.json(usedQRCodes);
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/validate', (req, res) => {
    const { qr } = req.body;
    let qrCodes = loadQRCodes();
    const qrCode = qrCodes.find(qrCode => qrCode.code === qr);

    if (qrCode) {
        if (!qrCode.used) {
            qrCode.used = true;
            saveQRCodes(qrCodes);
            res.json({ message: 'QR válido y registrado como usado' });
        } else {
            res.json({ message: 'El QR ya fue utilizado' });
        }
    } else {
        res.json({ message: 'QR no encontrado' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

