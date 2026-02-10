import express from 'express';
import Cliente from '../models/Cliente.js';

const router = express.Router();

// 1. BUSCAR CLIENTES (GET /api/clientes?busqueda=Juan)
router.get('/clientes', async (req, res) => {
    try {
        const { busqueda } = req.query;

        // Si no hay búsqueda, devolvemos los últimos 10
        if (!busqueda) {
            const recientes = await Cliente.find().limit(10).sort({ fecha_registro: -1 });
            return res.json(recientes);
        }

        // Búsqueda insensible a mayúsculas/minúsculas (Regex)
        const resultados = await Cliente.find({
            nombre_completo: { $regex: busqueda, $options: 'i' }
        }).limit(5); // Limitamos a 5 sugerencias

        res.json(resultados);

    } catch (error) {
        console.error("Error buscando clientes:", error);
        res.status(500).json({ error: "Error al buscar clientes" });
    }
});

// 2. CREAR CLIENTE (POST /api/clientes) -> Útil si queremos crear desde otro lado
router.post('/clientes', async (req, res) => {
    try {
        const { nombre, whatsapp } = req.body;
        const nuevoCliente = new Cliente({ nombre_completo: nombre, whatsapp });
        await nuevoCliente.save();
        res.status(201).json(nuevoCliente);
    } catch (error) {
        res.status(500).json({ error: "Error al crear cliente" });
    }
});

export default router;