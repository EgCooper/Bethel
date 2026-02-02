import mongoose from 'mongoose'; // Usamos import

const vehiculoSchema = new mongoose.Schema({
  marca: { type: String, required: true },
  modelo: { type: String, required: true },
  año: { type: Number, required: true },
  vin: { type: String, required: true, unique: true },
  precio_usd: { type: Number, required: true },
  kilometraje: { type: Number },
  color: { type: String },
  tipo_combustible: { type: String },
  transmision: { type: String },
  estado_vehiculo: { type: String },
  
  ubicacion: { 
      type: String, 
      required: true, 
      enum: ['USA (Subasta)', 'Bolivia (Disponible)', 'Iquique (Transito)'] 
  },
  
  imagen_url: { type: String },
  descripcion: { type: String },
  
  // El campo del asesor
  asesor_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario',
    required: false 
  },
  
  fecha_creacion: { type: Date, default: Date.now }
});

const Vehiculo = mongoose.model('Vehiculo', vehiculoSchema);
export default Vehiculo;