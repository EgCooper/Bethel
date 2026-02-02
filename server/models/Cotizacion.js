import mongoose from 'mongoose';

const cotizacionSchema = new mongoose.Schema({
    asesor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    cliente_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
    // RELACIÓN CON EL ASESOR (NUEVO)
    asesor_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario', // Conecta con la colección de Usuarios
        required: true 
    },
    
    vehiculo: {
        descripcion: { type: String, required: true }, // Ej: Mazda CX5 2024
        anio: Number,
        vin_lote: String
    },

    // AQUI ESTÁ LA ESTRUCTURA PARA JUSTIFICAR GASTOS EN LA IMPRESIÓN
    costos: {
        // 1. Compra
        precio_subasta: { type: Number, required: true },
        impuestos_subasta: { type: Number, default: 0 },
        
        // 2. Bancario
        costo_giro: { type: Number, default: 0 }, // Se calculará como 6% aprox
        
        // 3. Logística USA
        grua_usa: { type: Number, default: 0 },
        
        // 4. Logística Internacional
        flete_maritimo: { type: Number, default: 0 },
        transporte_terrestre: { type: Number, default: 0 },
        
        // 5. Operativo 
        comision_gestion: { type: Number, default: 900 }, // Tu ganancia
        tramites_aduana: { type: Number, default: 700 },
        
        // 6. Extras
        reparaciones: { type: Number, default: 0 },
        otros: { type: Number, default: 0 }
    },

    totales: {
        total_usd: Number,
        tipo_cambio: { type: Number, default: 6.97 }, // Modificable
        total_bob: Number
    },

    estado: { 
        type: String, 
        // Agregamos estados de negocio reales
        enum: ['Borrador', 'Aprobada', 'En Tránsito', 'En Aduana', 'Entregada', 'Cancelada'], 
        default: 'Borrador' 
    },
    fecha: { type: Date, default: Date.now }
});

export default mongoose.model('Cotizacion', cotizacionSchema);