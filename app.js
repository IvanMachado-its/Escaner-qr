const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path'); // Necesario para manejar rutas
const app = express();
const PORT = 8080;

// Función para cargar los códigos QR desde el archivo
function loadQRCodes() {
    const data = fs.readFileSync('qrcodes.json', 'utf8');
    return JSON.parse(data);
}

// Función para guardar los códigos QR en el archivo
function saveQRCodes(qrCodes) {
    fs.writeFileSync('qrcodes.json', JSON.stringify(qrCodes, null, 2));
}

app.use(bodyParser.json());

// Sirve los archivos estáticos de la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para validar el código QR
app.post('/validate', (req, res) => {
    const { qr } = req.body;
    let qrCodes = loadQRCodes();
    const qrCode = qrCodes.find(qrCode => qrCode.code === qr);

    if (qrCode) {
        if (!qrCode.used) {
            qrCode.used = true; // Marcar como usado
            saveQRCodes(qrCodes); // Guardar los cambios
            res.json({ message: 'QR válido y registrado como usado' });
        } else {
            res.json({ message: 'El QR ya fue utilizado' });
        }
    } else {
        res.json({ message: 'QR no encontrado' });
    }
});

// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
