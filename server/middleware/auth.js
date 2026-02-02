import jwt from 'jsonwebtoken';

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) return res.status(401).json({ error: 'Acceso denegado' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'clave_super_secreta_aerebetel_2026');
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Token no válido' });
  }
};

export default verificarToken;