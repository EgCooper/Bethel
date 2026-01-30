import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './db.js';
import apiRoutes from './routes/api.js';
import authRoutes from './routes/auth.js';
import vehiculosRoutes from './routes/vehiculos.js';
// Configuración
dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);
app.use('/api/vehiculos', vehiculosRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Bettel corriendo en puerto ${PORT}`);
});
