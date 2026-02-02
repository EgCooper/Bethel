import mongoose from 'mongoose';

const UsuarioSchema = new mongoose.Schema({
    nombre: { 
        type: String, 
        required: true 
    },
    username: { 
        type: String, 
        required: true, 
        unique: true 
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
    fecha_creacion: { 
        type: Date, 
        default: Date.now 
    }
});

// Exportamos usando la sintaxis moderna (ES Modules)
export default mongoose.model('Usuario', UsuarioSchema);