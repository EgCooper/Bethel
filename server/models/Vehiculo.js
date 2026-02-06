import mongoose from 'mongoose';

const vehiculoSchema = new mongoose.Schema({
  marca: { type: String, required: true },
  modelo: { type: String, required: true },
  año: { type: Number, required: true },
  vin: { type: String, required: true, unique: true },
  
  precio: { type: Number, required: true },
  moneda: { 
      type: String, 
      enum: ['USD', 'BOB'], 
      default: 'USD',
      required: true
  },

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


  situacion_legal: {
      type: String,
      enum: ['No Despachado (Sin Papeles)', 'En Trámite (Aduana)', 'Despachado (Con Papeles)'],
      default: 'No Despachado (Sin Papeles)'
  },
  placa: { 
      type: String, 
      default: 'Sin Placa'
  },

  descripcion: { type: String },
  asesor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },

  // 📸 IMÁGENES
  imagenes: [{ type: String }], 
  
  fecha_creacion: { type: Date, default: Date.now }
});

const Vehiculo = mongoose.model('Vehiculo', vehiculoSchema);
export default Vehiculo;