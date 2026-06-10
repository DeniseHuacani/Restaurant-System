const express = require('express');
const db = require('../db');
const { ValidationError, isValidId, isValidString, isValidDescription, isValidPriceCents } = require('../validation');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM productos ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM productos WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { id, nombre, precio_cents, disponibilidad = true, descripcion = '', estado = true, activo = true } = req.body;
    const errors = [];
    if (!id || !isValidId(id)) errors.push('El id es obligatorio y debe contener solo letras, números, guion o guion bajo.');
    if (!nombre || !isValidString(nombre)) errors.push('El nombre debe tener entre 2 y 50 caracteres.');
    if (!isValidPriceCents(precio_cents)) errors.push('El precio_cents debe ser un entero positivo (céntimos).');
    if (descripcion && !isValidDescription(descripcion)) errors.push('La descripcion debe tener entre 2 y 500 caracteres.');

    if (errors.length) return res.status(400).json({ errors });

    await db.query(
      'INSERT INTO productos (id, nombre, precio_cents, disponibilidad, descripcion, estado, activo) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [id, nombre.trim(), precio_cents, disponibilidad, descripcion.trim(), estado, activo]
    );
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

    if ('nombre' in fields) {
      if (!isValidString(fields.nombre)) return res.status(400).json({ error: 'El nombre debe tener entre 2 y 50 caracteres.' });
      set.push(`nombre = $${i}`); vals.push(fields.nombre.trim()); i++;
    }
    if ('precio_cents' in fields) {
      if (!isValidPriceCents(fields.precio_cents)) return res.status(400).json({ error: 'El precio_cents debe ser un entero positivo (céntimos).' });
      set.push(`precio_cents = $${i}`); vals.push(fields.precio_cents); i++;
    }
    if ('disponibilidad' in fields) { set.push(`disponibilidad = $${i}`); vals.push(!!fields.disponibilidad); i++; }
    if ('descripcion' in fields) {
      if (fields.descripcion && !isValidDescription(fields.descripcion)) return res.status(400).json({ error: 'La descripcion debe tener entre 2 y 500 caracteres.' });
      set.push(`descripcion = $${i}`); vals.push(fields.descripcion ? fields.descripcion.trim() : ''); i++;
    }
    if ('estado' in fields) { set.push(`estado = $${i}`); vals.push(!!fields.estado); i++; }
    if ('activo' in fields) { set.push(`activo = $${i}`); vals.push(!!fields.activo); i++; }

    if (set.length === 0) return res.status(400).json({ error: 'No fields' });
    vals.push(id);
    const q = `UPDATE productos SET ${set.join(', ')} WHERE id = $${i}`;
    await db.query(q, vals);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // If product has history in orden_items perform logical delete, otherwise physical
    const ref = await db.query('SELECT 1 FROM orden_items WHERE producto_id = $1 LIMIT 1', [id]);
    if (ref.rowCount > 0) {
      await db.query('UPDATE productos SET activo = false WHERE id = $1', [id]);
    } else {
      await db.query('DELETE FROM productos WHERE id = $1', [id]);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
