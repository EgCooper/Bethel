import express from 'express';
import Vehiculo from '../models/Vehiculo.js'; 
import verificarToken from '../middleware/auth.js'; 

const router = express.Router();

// 1. OBTENER TODOS
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

// 2. OBTENER UNO SOLO
router.get('/:id', async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findById(req.params.id)
      .populate('asesor_id', 'nombre telefono');
    if (!vehiculo) return res.status(404).json({ error: 'No encontrado' });
    res.json(vehiculo);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el vehículo' });
  }
});

// 3. CREAR NUEVO (Con ID de Asesor)
router.post('/', verificarToken, async (req, res) => {
  try {
    // Aquí asignamos el dueño automáticamente
    const nuevoAuto = new Vehiculo({
      ...req.body,
      asesor_id: req.user.id 
    });
    
    const autoGuardado = await nuevoAuto.save();
    res.status(201).json(autoGuardado);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear vehículo', detalle: error.message });
  }
});

// 4. ACTUALIZAR
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const autoActualizado = await Vehiculo.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    res.json(autoActualizado);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar' });
  }
});

// 5. ELIMINAR
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    await Vehiculo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vehículo eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

export default router;