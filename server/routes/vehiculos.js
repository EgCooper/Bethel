const express = require('express');
const router = express.Router();
const Vehiculo = require('../models/Vehiculo');
const verificarToken = require('../middleware/auth'); // Importante para saber quién es

// 1. OBTENER TODOS (PÚBLICO O PRIVADO)
router.get('/', async (req, res) => {
  try {
    // --- CAMBIO CLAVE: .populate('asesor_id') trae los datos del usuario ---
    const vehiculos = await Vehiculo.find()
      .populate('asesor_id', 'nombre telefono username') 
      .sort({ fecha_creacion: -1 });
      
    res.json(vehiculos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener vehículos' });
  }
});

// 2. OBTENER UNO SOLO (POR ID)
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

// 3. CREAR NUEVO (PROTEGIDO)
router.post('/', verificarToken, async (req, res) => {
  try {
    const nuevoAuto = new Vehiculo({
      ...req.body,
      // --- CAMBIO CLAVE: Asignamos el dueño automáticamente ---
      asesor_id: req.user.id 
    });
    
    const autoGuardado = await nuevoAuto.save();
    res.status(201).json(autoGuardado);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear vehículo', detalle: error.message });
  }
});

// 4. ACTUALIZAR (PROTEGIDO)
router.put('/:id', verificarToken, async (req, res) => {
  try {
    // Nota: No actualizamos el asesor_id aquí para que el dueño original se mantenga
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

// 5. ELIMINAR (PROTEGIDO - SOLO ADMIN O DUEÑO)
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    await Vehiculo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vehículo eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

module.exports = router;