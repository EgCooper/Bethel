import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import connectDB from './db.js';
import apiRoutes from './routes/api.js';
import authRoutes from './routes/auth.js';
import vehiculosRoutes from './routes/vehiculos.js';

// Importamos el modelo (Asegúrate de haber hecho el PASO 1)
import Vehiculo from './models/Vehiculo.js'; 

dotenv.config();
connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// --- 1. RUTAS API ---
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);
app.use('/api/vehiculos', vehiculosRoutes);

// --- 2. RUTA SEO PARA VEHÍCULOS (WhatsApp/Facebook) ---
app.get('/detalles/:id', async (req, res) => {
    const { id } = req.params;
    // Ajusta esta ruta si tu carpeta dist está en otro lado
    const indexPath = path.resolve(__dirname, '../client/dist/index.html');

    try {
        // Leemos el HTML compilado
        if (!fs.existsSync(indexPath)) {
            return res.status(404).send("Debes ejecutar 'npm run build' en la carpeta client primero.");
        }

        let html = fs.readFileSync(indexPath, 'utf8');

        // Buscamos el auto en la BD
        const auto = await Vehiculo.findById(id);

        if (auto) {
            const titulo = `${auto.marca} ${auto.modelo} ${auto.anio} - Bethel Motors`;
            const descripcion = `Precio: ${auto.precio} ${auto.moneda}. ${auto.descripcion?.substring(0, 100)}...`;
            
            const dominio = process.env.DOMAIN || 'https://bethelmotors.com'; 
            let imagen = '/logo.png';
            
            if (auto.imagenes && auto.imagenes.length > 0) {
                imagen = auto.imagenes[0];
            } else if (auto.imagen_url) {
                imagen = auto.imagen_url;
            }

            if (!imagen.startsWith('http')) {
                imagen = `${dominio}${imagen}`;
            }

            html = html
                .replace('__META_TITLE__', titulo)
                .replace('__META_DESCRIPTION__', descripcion)
                .replace('__META_OG_TITLE__', titulo)
                .replace('__META_OG_DESCRIPTION__', descripcion)
                .replace('__META_OG_IMAGE__', imagen)
                .replace('__META_URL__', `${dominio}/detalles/${id}`);
        } else {
            html = html.replace('__META_TITLE__', 'Vehículo no encontrado');
        }

        res.send(html);

    } catch (error) {
        console.error(error);
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.send("Error: No se encuentra el build del cliente.");
        }
    }
});

// --- 3. SERVIR FRONTEND ESTÁTICO ---
app.use(express.static(path.join(__dirname, '../client/dist')));

// ✅ CORRECCIÓN AQUÍ: Usamos Regex /(.*)/ en lugar de '*' para evitar el error
app.get(/(.*)/, (req, res) => {
    const indexPath = path.resolve(__dirname, '../client/dist/index.html');
    
    if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf8');
        // Valores por defecto
        html = html
            .replace('__META_TITLE__', 'Bethel Motors - Inventario')
            .replace('__META_DESCRIPTION__', 'Importación directa de vehículos y trámites aduaneros.')
            .replace('__META_OG_TITLE__', 'Bethel Motors')
            .replace('__META_OG_IMAGE__', '/logo.png');

        res.send(html);
    } else {
        res.send("El sistema está corriendo, pero falta el Frontend. Ejecuta 'npm run build' en la carpeta client.");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Bettel corriendo en puerto ${PORT}`);
});