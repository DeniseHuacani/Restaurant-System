const express = require('express');
const db = require('../db');
const { ValidationError, isValidId, isValidString } = require('../validation');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM meseros ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { id, nombre, dni, celular, estado = 'ACTIVO', activo = true } = req.body;
    const errors = [];
    if (!id || !isValidId(id)) errors.push('El id es obligatorio y solo permite letras, números, guion y guion bajo.');
    if (!nombre || !isValidString(nombre)) errors.push('El nombre debe tener entre 2 y 50 caracteres.');
    if (!dni || !/^\d{8}$/.test(dni)) errors.push('El DNI debe tener exactamente 8 dígitos numéricos.');
    if (!celular || !/^\d{9}$/.test(celular)) errors.push('El número de celular debe tener exactamente 9 dígitos numéricos.');
    if (!['ACTIVO', 'INACTIVO'].includes(estado)) errors.push('El estado debe ser ACTIVO o INACTIVO.');

    if (errors.length) return res.status(400).json({ errors });

    await db.query('INSERT INTO meseros (id, nombre, dni, celular, estado, activo) VALUES ($1,$2,$3,$4,$5,$6)', [id, nombre.trim(), dni, celular, estado, activo]);
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
    if ('dni' in fields) {
      if (!/^\d{8}$/.test(fields.dni)) return res.status(400).json({ error: 'El DNI debe tener exactamente 8 dígitos numéricos.' });
      set.push(`dni = $${i}`); vals.push(fields.dni); i++;
    }
    if ('celular' in fields) {
      if (!/^\d{9}$/.test(fields.celular)) return res.status(400).json({ error: 'El número de celular debe tener exactamente 9 dígitos numéricos.' });
      set.push(`celular = $${i}`); vals.push(fields.celular); i++;
    }
    if ('estado' in fields) {
      if (!['ACTIVO', 'INACTIVO'].includes(fields.estado)) return res.status(400).json({ error: 'El estado debe ser ACTIVO o INACTIVO.' });
      set.push(`estado = $${i}`); vals.push(fields.estado); i++;
    }
    if ('activo' in fields) { set.push(`activo = $${i}`); vals.push(!!fields.activo); i++; }

    if (set.length === 0) return res.status(400).json({ error: 'No fields' });
    vals.push(id);
    const q = `UPDATE meseros SET ${set.join(', ')} WHERE id = $${i}`;
    await db.query(q, vals);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // If mesero has history in ordenes perform logical delete, otherwise physical
    const ref = await db.query('SELECT 1 FROM ordenes WHERE mesero_id = $1 LIMIT 1', [id]);
    if (ref.rowCount > 0) {
      await db.query('UPDATE meseros SET activo = false WHERE id = $1', [id]);
    } else {
      await db.query('DELETE FROM meseros WHERE id = $1', [id]);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
