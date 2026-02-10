import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js'; 

const router = express.Router();

// CLAVE SECRETA (Idealmente en .env)
const JWT_SECRET = 'Cooperino9090!';

// --- 1. REGISTRAR USUARIO (CREAR) ---
router.post('/register', async (req, res) => {
    try {
        // ✅ CAMBIO: Recibimos 'email' en vez de 'username'
        const { nombre, email, password, rol, telefono } = req.body;

        // Validaciones básicas
        if (!email || !password || !nombre) {
            return res.status(400).json({ error: "Faltan campos obligatorios" });
        }

        // Verificar si ya existe el correo
        const existe = await Usuario.findOne({ email });
        if (existe) return res.status(400).json({ error: "El correo ya está registrado" });

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear usuario
        const nuevoUsuario = new Usuario({
            nombre,
            email, // ✅ Guardamos email
            password: hashedPassword,
            rol: rol || 'asesor',
            telefono: telefono || '',
            activo: true // Por defecto activo
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
        // ✅ CAMBIO: Login con email
        const { email, password } = req.body;

        // 1. Buscar usuario por email
        const usuario = await Usuario.findOne({ email });
        if (!usuario) return res.status(400).json({ error: "Usuario no encontrado" });

        // 2. ⛔ VERIFICAR SI ESTÁ ACTIVO (NUEVO)
        if (usuario.activo === false) {
            return res.status(403).json({ error: "Su cuenta ha sido deshabilitada. Contacte al administrador." });
        }

        // 3. Comparar contraseña
        const validPassword = await bcrypt.compare(password, usuario.password);
        if (!validPassword) return res.status(400).json({ error: "Contraseña incorrecta" });

        // 4. Crear Token
        const token = jwt.sign(
            { id: usuario._id, rol: usuario.rol, nombre: usuario.nombre },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        // 5. Responder
        res.json({
            mensaje: "Bienvenido",
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email, // Devolvemos email
                rol: usuario.rol,
                telefono: usuario.telefono
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
        const { nombre, email, password, telefono, rol, activo } = req.body;

        // 1. Preparamos los datos
        let datos = { nombre, email, telefono, rol };

        // Si envían el estado activo/inactivo, lo actualizamos
        if (typeof activo !== 'undefined') {
            datos.activo = activo;
        }

        // 2. Si hay contraseña nueva, la encriptamos
        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            datos.password = await bcrypt.hash(password, salt);
        }

        // 3. Actualizamos
        await Usuario.findByIdAndUpdate(id, datos);
        
        res.json({ mensaje: "Usuario actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar usuario" });
    }
});

// --- 6. CAMBIAR ESTADO (ACTIVAR/DESACTIVAR) RÁPIDO ---
router.patch('/users/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { activo } = req.body; // true o false

        await Usuario.findByIdAndUpdate(id, { activo });
        res.json({ mensaje: `Usuario ${activo ? 'activado' : 'deshabilitado'}` });
    } catch (error) {
        res.status(500).json({ error: "Error al cambiar estado" });
    }
});

export default router;