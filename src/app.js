import express from "express"
import { createServer } from 'http';
import { Server } from 'socket.io';
import ProductosRoute from "../route/productos.route.js"
import CarritosRoute from "../route/carritos.route.js"
import { engine as handlebars } from 'express-handlebars' 
import fs from 'fs/promises'; 
import { fileURLToPath } from 'url';
import path from 'path';  


//const express = require('express');
const app = express();
const PORT = 8080;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());


app.engine("handlebars",handlebars({
    // Usamos path.join para crear una ruta absoluta y robusta para el directorio de layouts
    layoutsDir: path.join(__dirname, "views", "layouts"),
    // Especificamos que 'main' es el layout por defecto
    defaultLayout: 'main',
    partialsDir: path.join(__dirname, "views")}))
app.set("views", path.join(__dirname , "views"))
app.set("view engine", "handlebars")
app.use(express.static(path.join(__dirname ,"static")))

// 1. Creamos el servidor HTTP a partir de la app de Express
const httpServer = createServer(app);

// 2. Inicializamos el servidor de Socket.io sobre el servidor HTTP
// Esto es CRUCIAL. IO es la instancia que usaremos para comunicarnos.
const io = new Server(httpServer);

app.use("/api/productos",ProductosRoute(io))
app.use("/api/carts",CarritosRoute)


async function readData(path) {
    try {
        const data = await fs.readFile(path, 'utf-8'); 
        return JSON.parse(data);
    } catch (error) {
        // Devuelve array vacío si el archivo no existe (ENOENT) o está vacío
        if (error.code === 'ENOENT' || error.message.includes('Unexpected end of JSON input')) {
            return [];
        }
        console.error(`Error al leer el archivo ${path}:`, error.message);
        throw error;
    }
}

const PRODUCTOS_PATH = path.join(__dirname,"../data/productos.json");


app.get('/realTimeProducts', async (req, res) => {
    try {
        const productos = await readData(PRODUCTOS_PATH);
        res.render('realTimeProducts', { 
            title: "Catálogo de Productos",
            productos: productos // Enviamos el array de productos a la vista
        });
    } catch (error) {
        res.status(500).render('error', { 
            title: "Error",
            message: "No se pudieron cargar los productos."
        });
    }
});

// CONEXIÓN SOCKET.IO (Eventos)
// ============================================
io.on('connection', (socket) => {
    console.log('🔌 Nuevo cliente conectado por WebSocket:', socket.id);

    // Puedes agregar manejo de desconexión aquí
    socket.on('disconnect', () => {
        console.log('❌ Cliente desconectado:', socket.id);
    });
});

httpServer.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
    console.log(`¡WebSockets activos! Prueba en http://localhost:8080/realtimeproducts`);
});
