import express from 'express';
import Vehiculo from '../models/Vehiculo.js';

const router = express.Router();

// 1. OBTENER TODOS (GET)
router.get('/', async (req, res) => {
    try {
        const vehiculos = await Vehiculo.find().sort({ fecha_registro: -1 });
        res.json(vehiculos);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener vehiculos" });
    }
});

// 2. CREAR NUEVO (POST)
router.post('/', async (req, res) => {
    try {
        const nuevoAuto = new Vehiculo(req.body);
        await nuevoAuto.save();
        res.json({ mensaje: "Vehiculo registrado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al registrar vehiculo" });
    }
});

// 3. ELIMINAR (DELETE)
router.delete('/:id', async (req, res) => {
    try {
        await Vehiculo.findByIdAndDelete(req.params.id);
        res.json({ mensaje: "Vehiculo eliminado" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
});
// 4. ACTUALIZAR (PUT)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Buscamos por ID y actualizamos con los datos nuevos (req.body)
        // { new: true } sirve para que nos devuelva el auto ya actualizado
        const autoActualizado = await Vehiculo.findByIdAndUpdate(id, req.body, { new: true });
        
        if (!autoActualizado) {
            return res.status(404).json({ error: "Vehiculo no encontrado" });
        }

        res.json(autoActualizado);
    } catch (error) {
        // Si el error es por VIN duplicado al editar
        if (error.code === 11000) {
            return res.status(400).json({ error: "El VIN ya existe en otro vehiculo" });
        }
        res.status(500).json({ error: "Error al actualizar" });
    }
});
export default router;