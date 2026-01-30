import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

const router = express.Router();

// CLAVE SECRETA (En producción esto va en un archivo .env, por ahora lo ponemos aquí)
const JWT_SECRET = 'clave_super_secreta_aerebetel_2026';

// --- 1. REGISTRAR USUARIO (Solo para crear el primer admin) ---
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
            telefono: telefono ||  '68593324',
            password: hashedPassword,
            rol: rol || 'asesor'
        });

        await nuevoUsuario.save();
        res.json({ mensaje: "Usuario creado exitosamente" });

    } catch (error) {
        res.status(500).json({ error: "Error al registrar usuario" });
    }
});

// --- 2. LOGIN (Ingreso al sistema) ---
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Buscar usuario
        const usuario = await Usuario.findOne({ username });
        if (!usuario) return res.status(400).json({ error: "Usuario no encontrado" });

        // 2. Comparar contraseña (la que escribe vs la encriptada)
        const validPassword = await bcrypt.compare(password, usuario.password);
        if (!validPassword) return res.status(400).json({ error: "Contraseña incorrecta" });

        // 3. Crear Token (El pase de acceso)
        const token = jwt.sign(
            { id: usuario._id, rol: usuario.rol, nombre: usuario.nombre },
            JWT_SECRET,
            { expiresIn: '8h' } // La sesión dura 8 horas
        );

        res.json({
            mensaje: "Bienvenido",
            token, // Enviamos el token al frontend
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                rol: usuario.rol
            }
        });

    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// --- 3. LISTAR USUARIOS (GET) ---
router.get('/users', async (req, res) => {
    try {
        // Buscamos todos, pero OCULTAMOS la contraseña (.select('-password'))
        const usuarios = await Usuario.find().select('-password').sort({ fecha_creacion: -1 });
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
});

// --- 4. ELIMINAR USUARIO (DELETE) ---
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Usuario.findByIdAndDelete(id);
        res.json({ mensaje: "Usuario eliminado" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar usuario" });
    }
});
// --- 5. EDITAR USUARIO (PUT) ---
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, username, password, telefono, rol } = req.body;

        // 1. Preparamos los datos básicos
        let datos = { nombre, username, telefono, rol };

        // 2. Solo si mandaron contraseña nueva, la encriptamos
        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            datos.password = await bcrypt.hash(password, salt);
        }

        // 3. Actualizamos en base de datos
        await Usuario.findByIdAndUpdate(id, datos);
        
        res.json({ mensaje: "Usuario actualizado" });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar usuario" });
    }
});

export default router;