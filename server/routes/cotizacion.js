import express from 'express';
import mongoose from 'mongoose';
import Cotizacion from '../models/Cotizacion.js';
import Cliente from '../models/Cliente.js';

const router = express.Router();

// 1. POST: CREAR COTIZACIÓN
router.post('/cotizar', async (req, res) => {
    try {
        const { cliente, cliente_id, vehiculo, costos, totales, asesor_id } = req.body;
        let finalClienteId = cliente_id;

        // Si es cliente nuevo, lo creamos
        if (!finalClienteId) {
            if (!cliente || !cliente.nombre) return res.status(400).json({error: "Datos de cliente incompletos"});
            const nuevoCliente = new Cliente({ nombre_completo: cliente.nombre, whatsapp: cliente.whatsapp });
            const clienteGuardado = await nuevoCliente.save();
            finalClienteId = clienteGuardado._id;
        }

        let asesorValido = (asesor_id && mongoose.Types.ObjectId.isValid(asesor_id)) ? asesor_id : null;

        const nuevaCotizacion = new Cotizacion({
            cliente: finalClienteId,
            vehiculo, costos, totales, 
            asesor: asesorValido,
            estado: 'Borrador' // Estado inicial
        });

        const guardado = await nuevaCotizacion.save();
        res.status(201).json({ mensaje: "Creado", id: guardado._id });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno" });
    }
});

// 2. ✅ GET: LISTAR TODAS (HISTORIAL) - ¡ESTA FALTABA!
router.get('/cotizaciones', async (req, res) => {
    try {
        const { usuario_id, rol } = req.query;
        let filtro = {};

        // Si NO es admin, solo ve sus propias cotizaciones
        if (rol !== 'admin' && usuario_id) {
            filtro.asesor = usuario_id;
        }

        const cotizaciones = await Cotizacion.find(filtro)
            .populate('cliente') // Trae nombre y whatsapp del cliente
            .populate('asesor', 'nombre') // Trae nombre del asesor
            .sort({ fecha: -1 }); // Las más nuevas primero

        // Mapeamos para que el frontend reciba '_id' y nombres claros
        const respuesta = cotizaciones.map(c => ({
            _id: c._id,
            fecha: c.fecha,
            estado: c.estado,
            cliente_id: c.cliente, // Populate devuelve el objeto entero
            asesor_id: c.asesor,
            vehiculo: c.vehiculo,
            totales: c.totales
        }));

        res.json(respuesta);

    } catch (error) {
        console.error("Error al listar:", error);
        res.status(500).json({ error: "No se pudo cargar el historial" });
    }
});

// 3. GET: UNA SOLA (Para Editar/Imprimir)
router.get('/cotizacion/:id', async (req, res) => {
    try {
        const cotizacion = await Cotizacion.findById(req.params.id).populate('cliente').populate('asesor', 'nombre');
        if (!cotizacion) return res.status(404).json({ error: "No encontrada" });
        res.json(cotizacion);
    } catch (error) {
        res.status(500).json({ error: "Error al leer" });
    }
});

// 4. ✅ PUT: ACTUALIZAR COTIZACIÓN (Edición completa)
router.put('/cotizacion/:id', async (req, res) => {
    try {
        await Cotizacion.findByIdAndUpdate(req.params.id, req.body);
        res.json({ mensaje: "Actualizado" });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar" });
    }
});

// 5. ✅ PATCH: ACTUALIZAR SOLO ESTADO (Rápido)
router.patch('/cotizacion/:id/estado', async (req, res) => {
    try {
        const { estado } = req.body;
        await Cotizacion.findByIdAndUpdate(req.params.id, { estado });
        res.json({ mensaje: "Estado cambiado" });
    } catch (error) {
        res.status(500).json({ error: "Error al cambiar estado" });
    }
});

// 6. ✅ DELETE: ELIMINAR
router.delete('/cotizacion/:id', async (req, res) => {
    try {
        await Cotizacion.findByIdAndDelete(req.params.id);
        res.json({ mensaje: "Eliminado" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
});

export default router;