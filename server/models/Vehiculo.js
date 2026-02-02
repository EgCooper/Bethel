import mongoose from 'mongoose';

const VehiculoSchema = new mongoose.Schema({
    marca: { type: String, required: true },
    modelo: { type: String, required: true },
    año: { type: Number, required: true },
    precio_usd: { type: Number, required: true },
    vin: { type: String, required: true, unique: true },
    kilometraje: { type: Number, required: true },
    color: { type: String, required: true },
    tipo_combustible: { type: String, required: true },
    transmision: { type: String, required: true },
    estado_vehiculo: { type: String, required: true },
    
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
    asesor_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario',
    required: false
  },
    fecha_registro: { type: Date, default: Date.now }
});

export default mongoose.model('Vehiculo', VehiculoSchema);