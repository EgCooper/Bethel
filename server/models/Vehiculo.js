import mongoose from 'mongoose';

const VehiculoSchema = new mongoose.Schema({
    marca: { type: String, required: true },
    modelo: { type: String, required: true },
    año: { type: Number, required: true }, // Nota: Usamos 'año' con ñ según tu pedido
    precio_usd: { type: Number, required: true },
    vin: { type: String, required: true, unique: true },
    kilometraje: { type: Number, required: true },
    color: { type: String, required: true },
    tipo_combustible: { type: String, required: true },
    transmision: { type: String, required: true },
    estado_vehiculo: { type: String, required: true }, // Ej: Nuevo, Usado, Chocado
    
    // Donde esta el auto actualmente
    ubicacion: { 
        type: String, 
        enum: ['USA (Subasta)', 'Chile (Transito)', 'Bolivia (Disponible)'], 
        default: 'USA (Subasta)' 
    },
    
    // Estado de venta
    estado: { 
        type: String, 
        enum: ['Disponible', 'Reservado', 'Vendido'], 
        default: 'Disponible' 
    },

    imagen_url: { type: String, default: "" }, 
    descripcion: { type: String },
    fecha_registro: { type: Date, default: Date.now }
});

export default mongoose.model('Vehiculo', VehiculoSchema);