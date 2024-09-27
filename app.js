const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Mutex } = require('async-mutex'); // Usamos mutex para sincronizar acceso
const app = express();
const PORT = 8080;

const mutex = new Mutex(); // Crear un mutex para exclusión mutua

// Función para cargar los códigos QR desde el archivo
async function loadQRCodes() {
    const data = await fs.promises.readFile('qrcodes.json', 'utf8');
    return JSON.parse(data);
}

// Función para guardar los códigos QR en el archivo
async function saveQRCodes(qrCodes) {
    await fs.promises.writeFile('qrcodes.json', JSON.stringify(qrCodes, null, 2));
}

app.get('/qrcodes', async (req, res) => {
    const release = await mutex.acquire(); // Bloquear acceso hasta que termine la operación
    try {
        const qrCodes = await loadQRCodes();
        const usedQRCodes = qrCodes.filter(qrCode => qrCode.used);
        res.json(usedQRCodes);
    } finally {
        release(); // Liberar el mutex después de completar la operación
    }
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/validate', async (req, res) => {
    const { qr } = req.body;

    const release = await mutex.acquire(); // Adquirir el mutex antes de acceder al archivo
    try {
        let qrCodes = await loadQRCodes();
        const qrCode = qrCodes.find(qrCode => qrCode.code === qr);

        if (qrCode) {
            if (!qrCode.used) {
                qrCode.used = true;
                await saveQRCodes(qrCodes); // Guardar el archivo actualizado
                res.json({ message: 'QR válido y registrado como usado' });
            } else {
                res.json({ message: 'El QR ya fue utilizado' });
            }
        } else {
            res.json({ message: 'QR no encontrado' });
        }
    } finally {
        release(); // Liberar el mutex después de completar la operación
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
