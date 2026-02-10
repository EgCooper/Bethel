// Archivo: server/models/Usuario.js
import mongoose from 'mongoose';

const UsuarioSchema = new mongoose.Schema({
    nombre: { 
        type: String, 
        required: true,
        trim: true
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        lowercase: true
    },
    telefono: {
        type: String,
        default: '',
    },
    password: { 
        type: String, 
        required: true 
    },
    rol: { 
        type: String, 
        enum: ['admin', 'asesor'], 
        default: 'asesor'
    },
    activo: {
        type: Boolean,
        default: true 
    },
    fecha_creacion: { 
        type: Date, 
        default: Date.now 
    }
});

export default mongoose.model('Usuario', UsuarioSchema);