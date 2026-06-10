const express = require('express');
const cors = require('cors');
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

app.get('/', (req, res) => res.json({ ok: true, message: 'Restaurant backend up' }));

module.exports = app;
