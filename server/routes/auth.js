import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js'; // ⚠️ Importante: .js al final

const router = express.Router();

// CLAVE SECRETA (Idealmente en .env)
const JWT_SECRET = 'clave_super_secreta_aerebetel_2026';

// --- 1. REGISTRAR USUARIO ---
router.post('/register', async (req, res) => {
    try {
        const { nombre, username, password, rol, telefono } = req.body;

        // Verificar si ya existe
        const existe = await Usuario.findOne({ username });
        if (existe) return res.status(400).json({ error: "El usuario ya existe" });

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear usuario
        const nuevoUsuario = new Usuario({
            nombre,
            username,
            password: hashedPassword,
            rol: rol || 'asesor',
            telefono: telefono || '' // Guardamos el teléfono que viene del form
        });

        await nuevoUsuario.save();
        res.status(201).json({ mensaje: "Usuario creado exitosamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al registrar usuario" });
    }
});

// --- 2. LOGIN ---
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Buscar usuario
        const usuario = await Usuario.findOne({ username });
        if (!usuario) return res.status(400).json({ error: "Usuario no encontrado" });

        // 2. Comparar contraseña
        const validPassword = await bcrypt.compare(password, usuario.password);
        if (!validPassword) return res.status(400).json({ error: "Contraseña incorrecta" });

        // 3. Crear Token
        const token = jwt.sign(
            { id: usuario._id, rol: usuario.rol, nombre: usuario.nombre },
            JWT_SECRET,
            { expiresIn: '12h' } // Aumenté un poco el tiempo de sesión
        );

        // 4. Responder (INCLUYENDO EL TELÉFONO)
        res.json({
            mensaje: "Bienvenido",
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                username: usuario.username,
                rol: usuario.rol,
                telefono: usuario.telefono // <--- IMPORTANTE: Enviarlo al frontend
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// --- 3. LISTAR USUARIOS ---
router.get('/users', async (req, res) => {
    try {
        const usuarios = await Usuario.find().select('-password').sort({ fecha_creacion: -1 });
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
});

// --- 4. ELIMINAR USUARIO ---
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Usuario.findByIdAndDelete(id);
        res.json({ mensaje: "Usuario eliminado" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar usuario" });
    }
});

// --- 5. EDITAR USUARIO ---
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, username, password, telefono, rol } = req.body;

        // 1. Preparamos los datos a actualizar
        let datos = { nombre, username, telefono, rol };

        // 2. Solo si hay contraseña nueva la encriptamos
        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            datos.password = await bcrypt.hash(password, salt);
        }

        // 3. Actualizamos
        await Usuario.findByIdAndUpdate(id, datos);
        
        res.json({ mensaje: "Usuario actualizado" });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar usuario" });
    }
});

export default router;