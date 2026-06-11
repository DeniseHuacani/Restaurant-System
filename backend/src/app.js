const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const productsRouter = require('./routes/products');
const mesasRouter = require('./routes/mesas');
const meserosRouter = require('./routes/meseros');
const ordersRouter = require('./routes/orders');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/productos', productsRouter);
app.use('/api/mesas', mesasRouter);
app.use('/api/meseros', meserosRouter);
app.use('/api/ordenes', ordersRouter);

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../../frontend')));

// Cualquier ruta que no sea de la API, redirige al index.html del frontend
// Esto es fundamental para que el despliegue funcione como una Single Page App
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

module.exports = app;
