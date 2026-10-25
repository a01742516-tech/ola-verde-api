require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());

// Conexión a la base de datos de Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 1. Ruta raíz: Muestra la tabla visual en HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. Endpoint GET: Devuelve los datos en formato JSON para llenar la tabla
app.get('/api/v1/proceso/prensado', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT * FROM prensado_lirio ORDER BY fecha_registro DESC'
    );
    res.json({
      status: 'success',
      total_registros: resultado.rowCount,
      data: resultado.rows
    });
  } catch (error) {
    console.error('Error al consultar Neon:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al obtener los registros de la base de datos.' 
    });
  }
});

// 3. Endpoint POST: Recibe y guarda nuevos datos de la prensa de lirio
app.post('/api/v1/proceso/prensado', async (req, res) => {
  const {
    lote_id,
    peso_inicial_kg,
    presion_prensa_psi,
    tiempo_prensado_min,
    litros_lixiviado,
    peso_final_kg,
    operador_id
  } = req.body;

  // Validación básica
  if (peso_final_kg >= peso_inicial_kg) {
    return res.status(400).json({
      status: 'error',
      message: 'El peso final no puede ser mayor o igual al peso inicial.'
    });
  }

  try {
    const query = `
      INSERT INTO prensado_lirio 
      (lote_id, peso_inicial_kg, presion_prensa_psi, tiempo_prensado_min, litros_lixiviado, peso_final_kg, operador_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, fecha_registro;
    `;
    const values = [
      lote_id,
      peso_inicial_kg,
      presion_prensa_psi,
      tiempo_prensado_min,
      litros_lixiviado,
      peso_final_kg,
      operador_id
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      status: 'success',
      message: 'Registro de prensado guardado correctamente en Neon.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al guardar:', error);
    res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de Ola Verde corriendo en el puerto ${PORT}`);
});