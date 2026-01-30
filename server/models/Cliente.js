import mongoose from 'mongoose';

const clienteSchema = new mongoose.Schema({
    nombre_completo: { type: String, required: true },
    whatsapp: { type: String, required: true },
    ciudad: { type: String },
    origen_contacto: { type: String, default: 'Facebook/TikTok' },
    fecha_registro: { type: Date, default: Date.now }
});

export default mongoose.model('Cliente', clienteSchema);