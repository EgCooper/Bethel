import express from 'express';
import Usuario from '../models/Usuario.js';
import Cliente from '../models/Cliente.js';
import Cotizacion from '../models/Cotizacion.js';
import mongoose from 'mongoose';

const router = express.Router();

// --- RUTAS DE PRUEBA ---
router.get('/ping', (req, res) => {
    res.send('Pong! La API responde correctamente.');
});

// --- 1. CREAR COTIZACIÓN (POST) ---
router.post('/cotizar', async (req, res) => {
    console.log(" [POST] Creando nueva cotización...");
    try {
        // Extraemos asesor_id del cuerpo de la petición
        const data = req.body;
        const { asesor_id } = data; 

        let clienteIdFinal = null;

        // Gestión del Cliente (Buscar o Crear)
        if (data.cliente && data.cliente.nombre) {
            let clienteExistente = null;
            if (data.cliente.whatsapp) {
                clienteExistente = await Cliente.findOne({ whatsapp: data.cliente.whatsapp });
            }
            if (clienteExistente) {
                clienteIdFinal = clienteExistente._id;
            } else {
                const nuevoCliente = new Cliente({
                    nombre_completo: data.cliente.nombre,
                    whatsapp: data.cliente.whatsapp || "Sin numero",
                    ciudad: "Bolivia"
                });
                const clienteGuardado = await nuevoCliente.save();
                clienteIdFinal = clienteGuardado._id;
            }
        }

        // Cálculos seguros
        const precio_subasta = parseFloat(data.costos.precio_subasta) || 0;
        const impuestos_subasta = parseFloat(data.costos.impuestos_subasta) || 0;
        let costo_giro = parseFloat(data.costos.costo_giro);
        if (isNaN(costo_giro)) costo_giro = (precio_subasta + impuestos_subasta) * 0.06;

        const nuevaCotizacion = new Cotizacion({
            cliente_id: clienteIdFinal,
            asesor_id: asesor_id, // <--- GUARDAMOS QUIÉN LO HIZO
            vehiculo: {
                descripcion: data.vehiculo.descripcion,
                anio: data.vehiculo.anio,
                vin_lote: data.vehiculo.vin_lote || "S/N"
            },
            costos: {
                precio_subasta,
                impuestos_subasta,
                costo_giro,
                grua_usa: parseFloat(data.costos.grua_usa) || 0,
                flete_maritimo: parseFloat(data.costos.flete_maritimo) || 0,
                transporte_terrestre: parseFloat(data.costos.transporte_terrestre) || 0,
                comision_gestion: parseFloat(data.costos.comision_gestion) || 900,
                tramites_aduana: parseFloat(data.costos.tramites_aduana) || 700,
                reparaciones: parseFloat(data.costos.reparaciones) || 0,
                otros: parseFloat(data.costos.otros) || 0
            },
            totales: data.totales,
            estado: 'Borrador'
        });

        const guardada = await nuevaCotizacion.save();
        console.log(" [POST] Cotización Creada. ID:", guardada._id, "| Asesor:", asesor_id);
        res.status(201).json({ mensaje: "Guardado", id: guardada._id });

    } catch (error) {
        console.error(" Error al crear:", error);
        res.status(500).json({ error: "Error interno" });
    }
});

// --- 2. EDITAR COTIZACIÓN (PUT) --- 
router.put('/cotizacion/:id', async (req, res) => {
    console.log(" [PUT] Editando cotización ID:", req.params.id);
    try {
        const { id } = req.params;
        const data = req.body;

        // Recalcular giro por seguridad
        const precio_subasta = parseFloat(data.costos.precio_subasta) || 0;
        const impuestos_subasta = parseFloat(data.costos.impuestos_subasta) || 0;
        let costo_giro = parseFloat(data.costos.costo_giro);
        if (isNaN(costo_giro)) costo_giro = (precio_subasta + impuestos_subasta) * 0.06;

        const actualizacion = {
            vehiculo: {
                descripcion: data.vehiculo.descripcion,
                anio: data.vehiculo.anio,
                vin_lote: data.vehiculo.vin_lote || "S/N"
            },
            costos: {
                precio_subasta,
                impuestos_subasta,
                costo_giro,
                grua_usa: parseFloat(data.costos.grua_usa) || 0,
                flete_maritimo: parseFloat(data.costos.flete_maritimo) || 0,
                transporte_terrestre: parseFloat(data.costos.transporte_terrestre) || 0,
                comision_gestion: parseFloat(data.costos.comision_gestion) || 0,
                tramites_aduana: parseFloat(data.costos.tramites_aduana) || 0,
                reparaciones: parseFloat(data.costos.reparaciones) || 0,
                otros: parseFloat(data.costos.otros) || 0
            },
            totales: data.totales,
            cliente_id: data.cliente_id 
            // NOTA: No actualizamos asesor_id aquí para mantener al creador original
        };

        // Actualizar datos del Cliente si cambiaron
        if (data.cliente_id && data.cliente) {
            await Cliente.findByIdAndUpdate(data.cliente_id, {
                nombre_completo: data.cliente.nombre,
                whatsapp: data.cliente.whatsapp
            });
        }

        const cotizacionActualizada = await Cotizacion.findByIdAndUpdate(id, actualizacion, { new: true });

        if (!cotizacionActualizada) return res.status(404).json({ error: "No encontrada" });

        console.log(" [PUT] Cotización Actualizada Correctamente.");
        res.json({ mensaje: "Actualizado", id: cotizacionActualizada._id });

    } catch (error) {
        console.error(" Error al editar:", error);
        res.status(500).json({ error: "Error al actualizar" });
    }
});

// --- 3. OBTENER UNA COTIZACIÓN (GET) ---
router.get('/cotizacion/:id', async (req, res) => {
    try {
        const cotizacion = await Cotizacion.findById(req.params.id)
            .populate('cliente_id')
            .populate('asesor_id', 'nombre username telefono');
            
        if (!cotizacion) return res.status(404).json({ error: "No encontrada" });
        res.json(cotizacion);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- 4. OBTENER HISTORIAL (INTELIGENTE) ---
router.get('/cotizaciones', async (req, res) => {
    try {
        // Recibimos quién pregunta desde el Frontend
        const { usuario_id, rol } = req.query;
        
        let filtro = {};

        // REGLA DE ORO:
        // Si NO es admin, forzamos a filtrar por su ID.
        // Si es admin, el filtro se queda vacío {} y trae todo.
        if (rol !== 'admin') {
            filtro.asesor_id = usuario_id;
        }

        const historial = await Cotizacion.find(filtro)
            .sort({ fecha: -1 })
            .populate('cliente_id')
            .populate('asesor_id', 'nombre');
            
        res.json(historial);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- 5. CAMBIAR SOLO EL ESTADO (PATCH) ---
router.patch('/cotizacion/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body; 

        const cotizacion = await Cotizacion.findByIdAndUpdate(
            id, 
            { estado }, 
            { new: true }
        );

        if (!cotizacion) return res.status(404).json({ error: "No encontrada" });
        
        console.log(`🚦 Estado actualizado a: ${estado} (ID: ${id})`);
        res.json(cotizacion);

    } catch (error) {
        res.status(500).json({ error: "Error al cambiar estado" });
    }
});

// --- 6. ELIMINAR COTIZACIÓN (DELETE) ---
router.delete('/cotizacion/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const eliminada = await Cotizacion.findByIdAndDelete(id);

        if (!eliminada) return res.status(404).json({ error: "No encontrada" });

        console.log(`🗑️ Cotización eliminada (ID: ${id})`);
        res.json({ mensaje: "Eliminada correctamente" });

    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
});

// --- 7. OBTENER CLIENTES (Con filtro de búsqueda) ---
router.get('/clientes', async (req, res) => {
    try {
        const { busqueda } = req.query;
        let filtro = {};

        if (busqueda) {
            filtro = {
                $or: [
                    { nombre_completo: { $regex: busqueda, $options: 'i' } },
                    { whatsapp: { $regex: busqueda, $options: 'i' } }
                ]
            };
        }

        const clientes = await Cliente.find(filtro)
            .sort({ fecha_registro: -1 })
            .limit(5);
            
        res.json(clientes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- 8. DASHBOARD / ESTADÍSTICAS (NUEVO) ---
router.get('/dashboard-stats', async (req, res) => {
    try {
        const { rol, usuario_id } = req.query;
        let filtro = {};

        // Si es asesor, filtramos SOLO sus datos. Si es admin, ve todo.
        if (rol !== 'admin') {
            filtro.asesor_id = usuario_id;
        }

        // 1. Total de Cotizaciones
        const totalDocs = await Cotizacion.countDocuments(filtro);

        // 2. Suma Total en Dólares (De todas las cotizaciones)
        // Usamos "aggregate" de MongoDB para sumar
        const sumaTotal = await Cotizacion.aggregate([
            { 
                $match: rol === 'admin' ? {} : { asesor_id: new mongoose.Types.ObjectId(usuario_id) } 
            },
            { 
                $group: { _id: null, total: { $sum: "$totales.total_usd" } } 
            }
        ]);
        const dineroTotal = sumaTotal.length > 0 ? sumaTotal[0].total : 0;

        // 3. Conteo por Estado (Ej: 5 en Borrador, 2 Entregadas)
        const porEstado = await Cotizacion.aggregate([
            { 
                $match: rol === 'admin' ? {} : { asesor_id: new mongoose.Types.ObjectId(usuario_id) } 
            },
            { 
                $group: { _id: "$estado", cantidad: { $sum: 1 } } 
            }
        ]);

        // 4. (SOLO ADMIN) Ranking de Vendedores
        let ranking = [];
        if (rol === 'admin') {
            ranking = await Cotizacion.aggregate([
                {
                    $group: {
                        _id: "$asesor_id",
                        cantidad: { $sum: 1 },
                        monto: { $sum: "$totales.total_usd" }
                    }
                },
                { $sort: { cantidad: -1 } }, // Ordenar: el que vendió más primero
                {
                    $lookup: { // Unir con la tabla usuarios para sacar el nombre
                        from: "usuarios",
                        localField: "_id",
                        foreignField: "_id",
                        as: "asesor"
                    }
                },
                { $unwind: "$asesor" },
                {
                    $project: {
                        nombre: "$asesor.nombre",
                        cantidad: 1,
                        monto: 1
                    }
                }
            ]);
        }

        res.json({
            totalDocs,
            dineroTotal,
            porEstado,
            ranking
        });

    } catch (error) {
        console.error("Error dashboard:", error);
        res.status(500).json({ error: "Error al calcular estadísticas" });
    }
});

export default router;