const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Folder do przeglądania
const BASE_FOLDER = path.join(__dirname, 'elozelo');

// Serwujemy pliki statyczne (np. CSS)
app.use(express.static(__dirname));

// Funkcja do generowania HTML folderów i plików
function generateHTML(folderPath, relativePath = '') {
    const items = fs.readdirSync(folderPath, { withFileTypes: true });

    let html = `<h1>Folder: ${relativePath || 'elozelo'}</h1>`;
    html += '<div class="folder-container">';
    
    for (const item of items) {
        if (item.isDirectory()) {
            html += `
            <a class="folder" href="/browse?path=${path.join(relativePath, item.name)}">
                <div class="folder-name">${item.name}</div>
            </a>`;
        } else {
            if (item.name.endsWith('.mp4')) {
                // link prowadzi do naszej nowej trasy /watch
                html += `
                <a class="file" href="/watch?path=${path.join(relativePath, item.name)}">
                    <div class="file-name">${item.name}</div>
                </a>`;
            } else {
                // reszta plików działa jak wcześniej
                html += `
                <a class="file" href="/elozelo/${path.join(relativePath, item.name)}" target="_blank">
                    <div class="file-name">${item.name}</div>
                </a>`;
            }
        }
    }

    html += '</div>';
    return html;
}



// Główny routing
app.get('/elozelo/', (req, res) => {
    const html = generateHTML(BASE_FOLDER);
    res.send(`
        <html>
        <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mini Explorer</title>
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
            ${html}
        </body>
        </html>
    `);
});


// Routing dla podfolderów
app.get('/browse', (req, res) => {
    const relPath = req.query.path || '';
    const folderPath = path.join(BASE_FOLDER, relPath);

    if (!fs.existsSync(folderPath)) {
        return res.send('Folder nie istnieje!');
    }

    const html = generateHTML(folderPath, relPath);
    res.send(`
        <html>
        <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mini Explorer</title>
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
            ${html}
            <a href="/elozelo/">⬅ Wróć</a>
        </body>
        </html>
    `);
});


// Start serwera
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serwer działa na http://localhost:${PORT}`);
});



// Wyświetlanie playera dla pliku wideo
app.get('/watch', (req, res) => {
    const relPath = req.query.path;
    const filePath = path.join(BASE_FOLDER, relPath);

    if (!fs.existsSync(filePath)) {
        return res.send('Plik nie istnieje!');
    }

    res.send(`
        <html>
        <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Odtwarzacz</title>
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
            <h1>${relPath}</h1>
            <video id="myVideo" width="640" height="360" controls autoplay preload="auto">
                <source src="/elozelo/${relPath}" type="video/mp4">
                Twoja przeglądarka nie obsługuje wideo.
            </video>
            <br>
            <a href="javascript:history.back()">⬅ Wróć</a>
        </body>
        <script>
            const video = document.getElementById('myVideo');

            const savedVolume = localStorage.getItem('videoVolume');
            if (savedVolume !== null) {
                video.volume = parseFloat(savedVolume); // 0.0 - 1.0
            }

            video.addEventListener('volumechange', () => {
                localStorage.setItem('videoVolume', video.volume);
            });
        </script>
        </html>
    `);
});
