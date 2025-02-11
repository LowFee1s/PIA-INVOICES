// compareDescriptorsWorker.js
const faceapi = require('../lib/face-api');
const { parentPort } = require('worker_threads');
const axios = require('axios');
const path = require('path');
const canvas = require('canvas');

// Inicializa los modelos de face-api.js
async function loadModels() {
  const modelPath = path.join(process.cwd(), 'models');
  faceapi.env.monkeyPatch({ Image: canvas.Image, Canvas: canvas.Canvas });
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
}

// Función para comparar descriptores
async function compareDescriptors(inputDescriptor, employeeDescriptors) {
  for (const employee of employeeDescriptors) {
    const distance = faceapi.euclideanDistance(inputDescriptor, Object.values(employee.face_descriptor));
    if (distance < 0.6) {
      return employee;
    }
  }
  return null;
}

// Escuchar mensajes del hilo principal
parentPort.on('message', async (data) => {
  const { imageBase64, employeeDescriptors } = data;

  await loadModels();
  const response = await axios.get(imageBase64, { responseType: 'arraybuffer' });
  const image = await canvas.loadImage(Buffer.from(response.data, 'binary'));
  const detections = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor();
  
  if (!detections || !detections.descriptor) {
    parentPort.postMessage({ error: 'No se detectó una cara válida' });
    return;
  }

  const inputFaceDescriptor = detections.descriptor;
  const matchedEmployee = await compareDescriptors(inputFaceDescriptor, employeeDescriptors);

  if (matchedEmployee) {
    parentPort.postMessage({ matchedEmployee });
  } else {
    parentPort.postMessage({ error: 'No se encontró coincidencia facial' });
  }
});
