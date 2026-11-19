const express = require('express');
const path = require('path');
const app = express();
const taskRoutes = require('./Rutas/taskRoutes');
require('dotenv').config();

app.use(express.static(path.join(__dirname, '../Frontend')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/', taskRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});