import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// IMPORTAR RUTAS
import authRoutes from './routes/auth.js';
import vehiculosRoutes from './routes/vehiculos.js';
import clienteRoutes from './routes/clientes.js';
import  cotizacionRoutes from './routes/cotizacion.js';

// ⚠️ IMPORTANTE: IMPORTA EL MODELO DE USUARIO PARA ARREGLAR EL ERROR
import Usuario from './models/Usuario.js'; 
import Cliente from './models/Cliente.js';
import Cotizacion from './models/Cotizacion.js';

dotenv.config();
const app = express();

// ... (Configuraciones de middleware cors, json, etc...) ...
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// CONEXIÓN A MONGODB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bethel_db')
    .then(async () => {
        console.log('✅ Conectado a MongoDB');

        // 🔥 PARCHE PARA CORREGIR TU ERROR E11000 🔥
        try {
            // Esto borra el índice viejo de "username" que causa el conflicto
            await Usuario.collection.dropIndex("username_1");
            console.log("✨ Índice problemático 'username_1' eliminado con éxito.");
        } catch (error) {
            // Si el índice ya no existe, dará error, pero no importa, seguimos.
            // console.log("Nota: El índice ya estaba limpio.");
        }
        // -----------------------------------------------------------

    })
    .catch((err) => console.error('❌ Error de conexión:', err));

// RUTAS
app.use('/auth', authRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api', cotizacionRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});