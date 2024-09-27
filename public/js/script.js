document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById("videoElement"); // Ahora debería encontrar el elemento de video
    let scanning = false;

    document.getElementById('startScan').addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });

            video.srcObject = stream;
            video.setAttribute("playsinline", true); // Evitar fullscreen en iOS Safari
            await video.play(); // Iniciar la reproducción del video
            
            document.getElementById('reader').classList.remove('hidden'); // Mostrar el área de escaneo
            scanning = true;
            scanQRCode(); // Iniciar el proceso de escaneo
        } catch (error) {
            console.error("Error al acceder a la cámara: ", error);
            document.getElementById('result').textContent = 'Error al acceder a la cámara.';
        }
    });

    async function scanQRCode() {
        if (scanning) {
            const canvasElement = document.createElement("canvas");
            const canvas = canvasElement.getContext("2d");

            canvasElement.height = video.videoHeight;
            canvasElement.width = video.videoWidth;

            canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
            const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const code = jsQR(imageData.data, canvasElement.width, canvasElement.height);

            if (code) {
                document.getElementById('qrInput').value = code.data;
                await validateQRCode(code.data);
                scanning = false; // Detener el escaneo después de encontrar un código
            }

            if (scanning) {
                requestAnimationFrame(scanQRCode);
            }
        }
    }

    async function validateQRCode(qr) {
        const response = await fetch('/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ qr }),
        });

        const result = await response.json();
        document.getElementById('result').textContent = result.message;
    }

    document.getElementById('qrForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const qr = document.getElementById('qrInput').value;
        await validateQRCode(qr);
    });

    document.getElementById('viewQRCodes').addEventListener('click', async () => {
        const response = await fetch('/qrcodes');
        const qrCodes = await response.json();
        const container = document.getElementById('qrCodesContainer');
        container.innerHTML = ''; // Limpiar el contenedor

        qrCodes.forEach(qrCode => {
            if (qrCode.used) { // Solo mostrar los utilizados
                const li = document.createElement('li');
                li.textContent = `${qrCode.code} - Utilizado`;
                container.appendChild(li);
            }
        });

        document.getElementById('qrList').classList.remove('hidden');
    });
});
