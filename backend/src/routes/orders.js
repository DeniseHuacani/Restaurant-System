const express = require('express');
const db = require('../db');
const { PACKAGING_FEE_CENTS, ORDER_STATES } = require('../constants');
const { ValidationError, isValidId, isValidString, isValidQuantity } = require('../validation');
const router = express.Router();

const ORDER_TYPES = ['MESA', 'PARA_LLEVAR'];

// List orders
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM ordenes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single order with items
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ordenRes = await db.query('SELECT * FROM ordenes WHERE id = $1', [id]);
    if (ordenRes.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    const itemsRes = await db.query('SELECT * FROM orden_items WHERE orden_id = $1', [id]);
    res.json({ ...ordenRes.rows[0], items: itemsRes.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create order with items (transactional, server-side validation & packaging fee)
router.post('/', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id, tipo, mesa_id = null, mesero_id = null, cliente = null, items = [] } = req.body;

    const errors = [];
    if (!id || !isValidId(id)) errors.push('El id de la orden es obligatorio y debe ser valido.');
    if (!ORDER_TYPES.includes(tipo)) errors.push('El tipo debe ser MESA o PARA_LLEVAR.');
    if (tipo === 'MESA') {
      if (!mesa_id) errors.push('mesa_id es obligatorio para orden de MESA.');
      if (!mesero_id) errors.push('mesero_id es obligatorio para orden de MESA.');
    } else {
      if (!cliente || !isValidString(cliente)) errors.push('El nombre del cliente es obligatorio para PARA_LLEVAR (2-50 chars).');
    }

    if (errors.length) return res.status(400).json({ errors });

    await client.query('BEGIN');

    // Validate mesa and mesero for MESA orders
    if (tipo === 'MESA') {
      const mesaRes = await client.query('SELECT * FROM mesas WHERE id = $1 FOR UPDATE', [mesa_id]);
      if (mesaRes.rowCount === 0) throw { status: 400, message: 'Mesa no encontrada.' };
      const mesa = mesaRes.rows[0];
      if (!mesa.activo || !mesa.habilitada) throw { status: 400, message: 'La mesa no está activa o no está habilitada.' };
      if (mesa.estado === 'OCUPADA') throw { status: 400, message: 'La mesa ya está OCUPADA.' };

      const meseroRes = await client.query('SELECT * FROM meseros WHERE id = $1', [mesero_id]);
      if (meseroRes.rowCount === 0) throw { status: 400, message: 'Mesero no encontrado.' };
      const mesero = meseroRes.rows[0];
      if (!mesero.activo || mesero.estado !== 'ACTIVO') throw { status: 400, message: 'El mesero no está activo.' };
    }

    // Insert order placeholder
    await client.query('INSERT INTO ordenes (id, tipo, mesa_id, mesero_id, cliente, estado, total_cents) VALUES ($1,$2,$3,$4,$5,$6,$7)', [id, tipo, mesa_id, mesero_id, cliente, 'PENDIENTE', 0]);

    // Insert items (use product price from DB to guarantee cent-precision)
    let total = 0;
    for (const it of items) {
      if (!it.producto_id) throw { status: 400, message: 'producto_id es obligatorio en items.' };
      const cantidad = Number(it.cantidad);
      if (!isValidQuantity(cantidad)) throw { status: 400, message: 'La cantidad debe ser un entero entre 1 y 99.' };

      const prodRes = await client.query('SELECT id, precio_cents, disponibilidad, activo FROM productos WHERE id = $1', [it.producto_id]);
      if (prodRes.rowCount === 0) throw { status: 400, message: `Producto ${it.producto_id} no encontrado.` };
      const prod = prodRes.rows[0];
      if (!prod.activo) throw { status: 400, message: `Producto ${it.producto_id} no está activo.` };
      if (!prod.disponibilidad) throw { status: 400, message: `Producto ${it.producto_id} no está disponible.` };

      const price = prod.precio_cents;
      await client.query('INSERT INTO orden_items (orden_id, producto_id, cantidad, precio_cents) VALUES ($1,$2,$3,$4)', [id, it.producto_id, cantidad, price]);
      total += (price * cantidad);
    }

    // Packaging fee if take-away
    if (tipo === 'PARA_LLEVAR') total += PACKAGING_FEE_CENTS;

    await client.query('UPDATE ordenes SET total_cents = $1 WHERE id = $2', [total, id]);

    // Mark mesa as OCUPADA if mesa order
    if (tipo === 'MESA') {
      await client.query('UPDATE mesas SET estado = $1 WHERE id = $2', ['OCUPADA', mesa_id]);
    }

    await client.query('COMMIT');
    res.status(201).json({ id, total_cents: total });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err && err.status) return res.status(err.status).json({ error: err.message });
    res.status(500).json({ error: err.message || String(err) });
  } finally {
    client.release();
  }
});

// Update order and optionally replace items (transactional, FSM checks, cent-precision)
router.put('/:id', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { tipo, mesa_id, mesero_id, cliente, estado, items } = req.body;

    await client.query('BEGIN');

    const ordenRes = await client.query('SELECT * FROM ordenes WHERE id = $1 FOR UPDATE', [id]);
    if (ordenRes.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
    const orden = ordenRes.rows[0];

    // Cannot modify CLOSED (PAGADO)
    if (orden.estado === 'PAGADO') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'La orden ya está PAGADO y no se puede modificar.' }); }

    // FSM: if estado provided, only allow advancing one step
    if (estado !== undefined) {
      const curIdx = ORDER_STATES.indexOf(orden.estado);
      const nextIdx = ORDER_STATES.indexOf(estado);
      if (nextIdx === -1) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Estado inválido.' }); }
      if (nextIdx !== curIdx && nextIdx !== curIdx + 1) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Transición de estado no permitida.' }); }
    }

    // Handle mesa changes: if assigning a new mesa, ensure it's free
    if (mesa_id !== undefined && mesa_id !== orden.mesa_id) {
      if (mesa_id) {
        const mesaRes = await client.query('SELECT * FROM mesas WHERE id = $1 FOR UPDATE', [mesa_id]);
        if (mesaRes.rowCount === 0) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Mesa no encontrada.' }); }
        const mesa = mesaRes.rows[0];
        if (!mesa.activo || !mesa.habilitada) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Mesa no activa o no habilitada.' }); }
        if (mesa.estado === 'OCUPADA') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Mesa ya está OCUPADA.' }); }
        // mark new mesa occupied
        await client.query('UPDATE mesas SET estado = $1 WHERE id = $2', ['OCUPADA', mesa_id]);
      }
      // free old mesa if existed
      if (orden.mesa_id) {
        const oldMesaRes = await client.query('SELECT habilitada FROM mesas WHERE id = $1 FOR UPDATE', [orden.mesa_id]);
        if (oldMesaRes.rowCount > 0) {
          const newEstado = oldMesaRes.rows[0].habilitada ? 'LIBRE' : 'DESHABILITADA';
          await client.query('UPDATE mesas SET estado = $1 WHERE id = $2', [newEstado, orden.mesa_id]);
        }
      }
    }

    // Prepare fields update
    const fields = [];
    const vals = [];
    let i = 1;
    if (tipo !== undefined) { if (!ORDER_TYPES.includes(tipo)) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Tipo inválido.' }); } fields.push(`tipo = $${i++}`); vals.push(tipo); }
    if (mesa_id !== undefined) { fields.push(`mesa_id = $${i++}`); vals.push(mesa_id); }
    if (mesero_id !== undefined) { fields.push(`mesero_id = $${i++}`); vals.push(mesero_id); }
    if (cliente !== undefined) { if (cliente && !isValidString(cliente)) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'El nombre del cliente debe tener entre 2 y 50 caracteres.' }); } fields.push(`cliente = $${i++}`); vals.push(cliente); }
    if (estado !== undefined) { fields.push(`estado = $${i++}`); vals.push(estado); }

    if (fields.length > 0) {
      vals.push(id);
      const q = `UPDATE ordenes SET ${fields.join(', ')} WHERE id = $${i}`;
      await client.query(q, vals);
    }

    // If items provided, validate and replace atomically
    if (Array.isArray(items)) {
      // Only allow item modification in PENDIENTE or EN COCINA
      if (!['PENDIENTE', 'EN COCINA'].includes(orden.estado)) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'No se pueden modificar items en el estado actual.' }); }

      await client.query('DELETE FROM orden_items WHERE orden_id = $1', [id]);
      let total = 0;
      const effectiveTipo = tipo !== undefined ? tipo : orden.tipo;

      for (const it of items) {
        if (!it.producto_id) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'producto_id es obligatorio en items.' }); }
        const cantidad = Number(it.cantidad);
        if (!isValidQuantity(cantidad)) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'La cantidad debe ser un entero entre 1 y 99.' }); }

        const prodRes = await client.query('SELECT id, precio_cents, disponibilidad, activo FROM productos WHERE id = $1', [it.producto_id]);
        if (prodRes.rowCount === 0) { await client.query('ROLLBACK'); return res.status(400).json({ error: `Producto ${it.producto_id} no encontrado.` }); }
        const prod = prodRes.rows[0];
        if (!prod.activo) { await client.query('ROLLBACK'); return res.status(400).json({ error: `Producto ${it.producto_id} no está activo.` }); }
        if (!prod.disponibilidad) { await client.query('ROLLBACK'); return res.status(400).json({ error: `Producto ${it.producto_id} no está disponible.` }); }

        const price = prod.precio_cents;
        await client.query('INSERT INTO orden_items (orden_id, producto_id, cantidad, precio_cents) VALUES ($1,$2,$3,$4)', [id, it.producto_id, cantidad, price]);
        total += (price * cantidad);
      }

      if (effectiveTipo === 'PARA_LLEVAR') total += PACKAGING_FEE_CENTS;
      await client.query('UPDATE ordenes SET total_cents = $1 WHERE id = $2', [total, id]);
    }

    // If transitioning to PAGADO, release mesa automatically
    const finalEstado = estado !== undefined ? estado : orden.estado;
    const finalMesa = (mesa_id !== undefined) ? mesa_id : orden.mesa_id;
    if (finalEstado === 'PAGADO' && finalMesa) {
      const mesaRes = await client.query('SELECT habilitada FROM mesas WHERE id = $1 FOR UPDATE', [finalMesa]);
      if (mesaRes.rowCount > 0) {
        const newEstado = mesaRes.rows[0].habilitada ? 'LIBRE' : 'DESHABILITADA';
        await client.query('UPDATE mesas SET estado = $1 WHERE id = $2', [newEstado, finalMesa]);
      }
    }

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err && err.status) return res.status(err.status).json({ error: err.message });
    res.status(500).json({ error: err.message || String(err) });
  } finally {
    client.release();
  }
});

module.exports = router;
