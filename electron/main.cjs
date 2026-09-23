const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

let mainWindow;
let djangoProcess;

// ========================================
// CONFIGURACIÓN DEL BACKEND
// ========================================

const backendPath =
    "C:\\Users\\kenne\\OneDrive\\Escritorio\\panaderia_backend";

const pythonPath = path.join(
    backendPath,
    "venv",
    "Scripts",
    "python.exe"
);

const serverScript = path.join(
    backendPath,
    "run_server.py"
);


// ========================================
// INICIAR DJANGO
// ========================================

function startDjango() {
    console.log("Iniciando Django...");

    djangoProcess = spawn(
        pythonPath,
        [serverScript],
        {
            cwd: backendPath,
            windowsHide: true,
            stdio: ["ignore", "pipe", "pipe"],
        }
    );

    djangoProcess.stdout.on("data", (data) => {
        console.log(`[Django] ${data.toString()}`);
    });

    djangoProcess.stderr.on("data", (data) => {
        console.error(`[Django] ${data.toString()}`);
    });

    djangoProcess.on("error", (error) => {
        console.error("Error iniciando Django:", error);
    });

    djangoProcess.on("close", (code) => {
        console.log(`Django finalizó con código: ${code}`);
    });
}


// ========================================
// ESPERAR A QUE DJANGO ESTÉ DISPONIBLE
// ========================================

function waitForDjango() {
    return new Promise((resolve) => {

        const checkServer = () => {

            const request = http.get(
                "http://127.0.0.1:8000/",
                (response) => {

                    console.log(
                        `Django respondió con HTTP ${response.statusCode}`
                    );

                    response.resume();

                    resolve();
                }
            );

            request.on("error", () => {

                console.log(
                    "Esperando a que Django esté disponible..."
                );

                setTimeout(checkServer, 500);
            });

            request.setTimeout(1000, () => {
                request.destroy();
            });
        };

        checkServer();
    });
}


// ========================================
// CREAR VENTANA
// ========================================

function createWindow() {

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,

        minWidth: 1100,
        minHeight: 700,

        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.loadFile(
        path.join(
            __dirname,
            "..",
            "dist",
            "index.html"
        )
    );
}


// ========================================
// INICIAR APLICACIÓN
// ========================================

app.whenReady().then(async () => {

    console.log("=================================");
    console.log("     PANADERÍA - INICIANDO");
    console.log("=================================");

    // 1. Iniciar Django
    startDjango();

    // 2. Esperar a que Django esté listo
    await waitForDjango();

    // 3. Abrir React
    console.log("Django está listo.");
    console.log("Iniciando interfaz React...");

    createWindow();

    app.on("activate", () => {

        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }

    });

});


// ========================================
// CERRAR DJANGO AL CERRAR ELECTRON
// ========================================

app.on("window-all-closed", () => {

    if (djangoProcess) {

        console.log("Cerrando Django...");

        djangoProcess.kill();
    }

    if (process.platform !== "darwin") {
        app.quit();
    }

});


// ========================================
// SEGURIDAD EXTRA AL CERRAR ELECTRON
// ========================================

app.on("before-quit", () => {

    if (djangoProcess) {

        console.log("Deteniendo servidor Django...");

        djangoProcess.kill();
        djangoProcess = null;
    }

});