import schedule from 'node-cron';
import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'https://c462-2806-109f-10-5b94-8d11-a7bf-bd27-2097.ngrok-free.app/api/send-email-payment';

// Programar la ejecución de la API a las 8:00 AM cada día
schedule('45 14 * * *', async () => {
  console.log('⏳ Ejecutando programación de correos...');
  try {
    await fetch(API_URL, {
      method: 'GET', // o 'POST', dependiendo de la configuración de tu API
      headers: {
        'Authorization': `Bearer ${process.env.TOKENAPP}`, // Si tienes autenticación
      }
    });
    console.log('✅ Correos programados.');
  } catch (error) {
    console.error('Error al ejecutar el cron job:', error);
  }
});

// const jwt = require('jsonwebtoken');

// // Definir tu clave secreta
// const secretKey = "";

// // Generar el token
// const token = jwt.sign({ role: 'email' }, secretKey); // 'expiresIn' puede no ser necesario si no quieres que caduque
// console.log(token);
