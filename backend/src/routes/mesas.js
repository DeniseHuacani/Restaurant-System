const express = require('express');
const db = require('../db');
const { isValidId } = require('../validation');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM mesas ORDER BY numero');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { id, numero, capacidad, estado = 'LIBRE', habilitada = true, activo = true } = req.body;
    const errors = [];
    if (!id || !isValidId(id)) errors.push('El id es obligatorio y solo permite letras, números, guion o guion bajo.');
    if (!Number.isInteger(numero) || numero < 1) errors.push('El numero debe ser un entero mayor o igual a 1.');
    if (!Number.isInteger(capacidad) || capacidad < 1 || capacidad > 16) errors.push('La capacidad debe estar entre 1 y 16.');
    if (!['LIBRE', 'OCUPADA', 'DESHABILITADA'].includes(estado)) errors.push('El estado debe ser LIBRE, OCUPADA o DESHABILITADA.');

    if (errors.length) return res.status(400).json({ errors });

    await db.query('INSERT INTO mesas (id, numero, capacidad, estado, habilitada, activo) VALUES ($1,$2,$3,$4,$5,$6)', [id, numero, capacidad, estado, habilitada, activo]);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const set = [];
    const vals = [];
    let i = 1;

    if ('numero' in fields) {
      if (!Number.isInteger(fields.numero) || fields.numero < 1) return res.status(400).json({ error: 'El numero debe ser un entero mayor o igual a 1.' });
      set.push(`numero = $${i}`); vals.push(fields.numero); i++;
    }
    if ('capacidad' in fields) {
      if (!Number.isInteger(fields.capacidad) || fields.capacidad < 1 || fields.capacidad > 16) return res.status(400).json({ error: 'La capacidad debe estar entre 1 y 16.' });
      set.push(`capacidad = $${i}`); vals.push(fields.capacidad); i++;
    }
    if ('estado' in fields) {
      if (!['LIBRE', 'OCUPADA', 'DESHABILITADA'].includes(fields.estado)) return res.status(400).json({ error: 'El estado debe ser LIBRE, OCUPADA o DESHABILITADA.' });
      // If trying to set OCUPADA ensure no active orders
      if (fields.estado === 'OCUPADA') {
        const active = await db.query('SELECT 1 FROM ordenes WHERE mesa_id = $1 AND estado != $2 LIMIT 1', [id, 'PAGADO']);
        if (active.rowCount > 0) return res.status(400).json({ error: 'La mesa tiene una orden activa y no puede marcarse OCUPADA.' });
      }
      set.push(`estado = $${i}`); vals.push(fields.estado); i++;
    }
    if ('habilitada' in fields) { set.push(`habilitada = $${i}`); vals.push(!!fields.habilitada); i++; }
    if ('activo' in fields) { set.push(`activo = $${i}`); vals.push(!!fields.activo); i++; }

    if (set.length === 0) return res.status(400).json({ error: 'No fields' });
    vals.push(id);
    const q = `UPDATE mesas SET ${set.join(', ')} WHERE id = $${i}`;
    await db.query(q, vals);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
