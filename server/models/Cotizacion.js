import mongoose from 'mongoose';

const CotizacionSchema = new mongoose.Schema({
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
    asesor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    
    // ✅ NUEVO CAMPO: ESTADO
    estado: { 
        type: String, 
        default: 'Borrador',
        enum: ['Borrador', 'Aprobada', 'En Tránsito', 'En Aduana', 'Entregada', 'Cancelada'] 
    },

    vehiculo: {
        marca: String,
        modelo: String,
        anio: Number,
        vin: String,
        descripcion: String
    },

    costos: {
        precio_subasta: Number,
        impuestos_subasta: Number,
        grua_usa: Number,
        flete_maritimo: Number,
        transporte_terrestre: Number,
        comision_gestion: Number,
        tramites_aduana: Number,
        reparaciones: Number,
        costo_giro: Number
    },

    totales: {
        tipo_cambio: Number,
        total_usd: Number,
        total_bob: Number
    },

    fecha: { type: Date, default: Date.now }
});

export default mongoose.model('Cotizacion', CotizacionSchema);