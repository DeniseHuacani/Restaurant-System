// Servicio API para sincronizar el frontend con el backend (Postgres)
// Este módulo usa fetch y exporta funciones async para obtener y sincronizar
// mesas, meseros, productos y ordenes (con items).

const API_BASE = (typeof window !== 'undefined' && window.location)
  ? `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ':3000'}/api`
  : 'http://localhost:3000/api';

function priceFromCents(cents) {
  return (Number(cents) / 100).toFixed(2);
}

function priceToCents(value) {
  const cleaned = String(value).replace(',', '.');
  const n = Number(cleaned);
  if (Number.isNaN(n)) throw new Error('Precio invalido');
  return Math.round(n * 100);
}

async function safeJson(resp) {
  try {
    return await resp.json();
  } catch (e) {
    return [];
  }
}

export async function fetchMesas() {
  const resp = await fetch(`${API_BASE}/mesas`);
  if (!resp.ok) throw new Error('Error fetching mesas');
  const rows = await resp.json();
  return rows.map(r => ({
    id: r.id,
    numero: Number(r.numero),
    capacidad: Number(r.capacidad),
    estado: r.estado,
    habilitada: r.habilitada === true || r.habilitada === 'true' || r.habilitada === 1,
    activo: r.activo === false ? false : true
  }));
}

export async function fetchMeseros() {
  const resp = await fetch(`${API_BASE}/meseros`);
  if (!resp.ok) throw new Error('Error fetching meseros');
  const rows = await resp.json();
  return rows.map(r => ({
    id: r.id,
    nombre: r.nombre,
    dni: r.dni,
    celular: r.celular,
    estado: r.estado,
    activo: r.activo === false ? false : true
  }));
}

export async function fetchProductos() {
  const resp = await fetch(`${API_BASE}/productos`);
  if (!resp.ok) throw new Error('Error fetching productos');
  const rows = await resp.json();
  return rows.map(r => ({
    id: r.id,
    nombre: r.nombre,
    precio: priceFromCents(r.precio_cents),
    disponibilidad: r.disponibilidad === true || r.disponibilidad === 'true' || r.disponibilidad === 1,
    estado: r.estado === true || r.estado === 'true' || r.estado === 1,
    descripcion: r.descripcion || '',
    activo: r.activo === false ? false : true
  }));
}

export async function fetchOrdenesWithItems() {
  const resp = await fetch(`${API_BASE}/ordenes`);
  if (!resp.ok) throw new Error('Error fetching ordenes');
  const orders = await resp.json();

  // get products to map nombre
  const productos = await fetchProductos();
  const prodMap = Object.fromEntries(productos.map(p => [p.id, p]));

  const detailed = await Promise.all(
    orders.map(async (o) => {
      try {
        const oResp = await fetch(`${API_BASE}/ordenes/${o.id}`);
        if (!oResp.ok) return { id: o.id, tipo: o.tipo, mesaId: o.mesa_id || null, meseroId: o.mesero_id || null, cliente: o.cliente || '', estado: o.estado || 'PENDIENTE', items: [] };
        const full = await oResp.json();
        const items = (full.items || []).map(it => ({
          productId: String(it.producto_id),
          nombre: prodMap[it.producto_id] ? prodMap[it.producto_id].nombre : '',
          cantidad: Number(it.cantidad),
          precioCents: Number(it.precio_cents)
        }));
        return {
          id: o.id,
          tipo: o.tipo,
          mesaId: o.mesa_id || null,
          meseroId: o.mesero_id || null,
          cliente: o.cliente || '',
          estado: o.estado || 'PENDIENTE',
          items
        };
      } catch (e) {
        return { id: o.id, tipo: o.tipo, mesaId: o.mesa_id || null, meseroId: o.mesero_id || null, cliente: o.cliente || '', estado: o.estado || 'PENDIENTE', items: [] };
      }
    })
  );

  return detailed;
}

const cache = {
  mesas: new Set(),
  meseros: new Set(),
  productos: new Set(),
  ordenes: new Set()
};

export async function fetchAll() {
  const [mesas, meseros, productos, ordenes] = await Promise.all([
    fetchMesas(),
    fetchMeseros(),
    fetchProductos(),
    fetchOrdenesWithItems()
  ]);
  mesas.forEach(m => cache.mesas.add(m.id));
  meseros.forEach(m => cache.meseros.add(m.id));
  productos.forEach(p => cache.productos.add(p.id));
  ordenes.forEach(o => cache.ordenes.add(o.id));
  return { mesas, meseros, productos, ordenes };
}

export async function upsertMesas(mesasArray) {
  const ops = mesasArray.map(async (mesa) => {
    const payload = { numero: mesa.numero, capacidad: mesa.capacidad, estado: mesa.estado, habilitada: mesa.habilitada, activo: mesa.activo };
    if (cache.mesas.has(mesa.id)) {
      await fetch(`${API_BASE}/mesas/${encodeURIComponent(mesa.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      await fetch(`${API_BASE}/mesas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: mesa.id, ...payload }) });
      cache.mesas.add(mesa.id);
    }
  });
  await Promise.all(ops);
}

export async function upsertMeseros(meserosArray) {
  const ops = meserosArray.map(async (mesero) => {
    const payload = { nombre: mesero.nombre, dni: mesero.dni, celular: mesero.celular, estado: mesero.estado, activo: mesero.activo };
    if (cache.meseros.has(mesero.id)) {
      await fetch(`${API_BASE}/meseros/${encodeURIComponent(mesero.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      await fetch(`${API_BASE}/meseros`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: mesero.id, ...payload }) });
      cache.meseros.add(mesero.id);
    }
  });
  await Promise.all(ops);
}

export async function upsertProductos(productosArray) {
  const ops = productosArray.map(async (producto) => {
    const precio_cents = (typeof producto.precio === 'number') ? Math.round(producto.precio * 100) : priceToCents(producto.precio);
    const payload = { nombre: producto.nombre, precio_cents, disponibilidad: producto.disponibilidad, descripcion: producto.descripcion || '', estado: producto.estado, activo: producto.activo };
    if (cache.productos.has(producto.id)) {
      await fetch(`${API_BASE}/productos/${encodeURIComponent(producto.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      await fetch(`${API_BASE}/productos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: producto.id, ...payload }) });
      cache.productos.add(producto.id);
    }
  });
  await Promise.all(ops);
}

export async function upsertOrdenes(ordenesArray) {
  const ops = ordenesArray.map(async (orden) => {
    const payload = {
      id: orden.id,
      tipo: orden.tipo,
      mesa_id: orden.mesaId || null,
      mesero_id: orden.meseroId || null,
      cliente: orden.cliente || null,
      estado: orden.estado || 'PENDIENTE'
    };

    const items = (orden.items || []).map(it => ({ producto_id: it.productId, cantidad: it.cantidad, precio_cents: it.precioCents }));

    if (cache.ordenes.has(orden.id)) {
      // actualizar (se espera que el backend soporte PUT /api/ordenes/:id)
      await fetch(`${API_BASE}/ordenes/${encodeURIComponent(orden.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, items }) });
    } else {
      await fetch(`${API_BASE}/ordenes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, items }) });
      cache.ordenes.add(orden.id);
    }
  });

  await Promise.all(ops);
}

export async function probarAPI() {
  try {
    const r = await fetch(`${API_BASE}/productos`);
    const data = await r.json();
    console.log('API OK, productos:', data.length);
  } catch (e) {
    console.error('API no disponible:', e.message);
  }
}
