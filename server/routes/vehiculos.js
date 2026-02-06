import express from 'express';
import Vehiculo from '../models/Vehiculo.js'; 
import verificarToken from '../middleware/auth.js';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// 1. CONFIGURACIÓN DE CLOUDINARY
cloudinary.config({ 
  cloud_name: 'dwdpcxryz', 
  api_key: '279838228451513', 
  api_secret: 'ecl15izYxcMQHxAY9ceQgY4zARs' 
});

// 2. CONFIGURACIÓN DE MULTER (Para leer archivos en memoria RAM)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

// --- RUTAS ---

// GET: Obtener todos
router.get('/', async (req, res) => {
  try {
    const vehiculos = await Vehiculo.find()
      .populate('asesor_id', 'nombre telefono username')
      .sort({ fecha_creacion: -1 });
    res.json(vehiculos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener vehículos' });
  }
});

// GET: Uno solo
router.get('/:id', async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findById(req.params.id)
      .populate('asesor_id', 'nombre telefono');
    if (!vehiculo) return res.status(404).json({ error: 'No encontrado' });
    res.json(vehiculo);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener vehículo' });
  }
});

// POST: CREAR VEHÍCULO (Con Imágenes y corrección de 'año')
router.post('/', verificarToken, upload.array('fotos', 5), async (req, res) => {
  try {
    // 1. Subir imágenes a Cloudinary (si las hay)
    let urlsImagenes = [];
    
    if (req.files && req.files.length > 0) {
      const promesasDeSubida = req.files.map(file => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "aerebetel_stock" }, // Nombre de la carpeta en la nube
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          );
          uploadStream.end(file.buffer);
        });
      });
      urlsImagenes = await Promise.all(promesasDeSubida);
    }

    // 2. Crear el vehículo
    const nuevoAuto = new Vehiculo({
      ...req.body,
      
      // 👇 SOLUCIÓN AL ERROR DE VALIDACIÓN 👇
      // Si el frontend envía 'anio' (por la ñ), lo guardamos como 'año'
      año: req.body.año || req.body.anio, 

      imagenes: urlsImagenes, // Guardamos el array de links
      asesor_id: req.user.id
    });
    
    const autoGuardado = await nuevoAuto.save();
    res.status(201).json(autoGuardado);

  } catch (error) {
    console.error("Error backend:", error);
    res.status(400).json({ error: 'Error al subir vehículo', detalle: error.message });
  }
});

// PUT: ACTUALIZAR VEHÍCULO (Solo datos, sin fotos nuevas por ahora)
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const datosActualizar = { ...req.body };

    // Si viene 'anio', lo convertimos a 'año' también aquí
    if (datosActualizar.anio) {
        datosActualizar.año = datosActualizar.anio;
    }

    const autoActualizado = await Vehiculo.findByIdAndUpdate(
      req.params.id, 
      datosActualizar, 
      { new: true }
    );
    res.json(autoActualizado);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar' });
  }
});

// DELETE: ELIMINAR
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    await Vehiculo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vehículo eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

export default router;