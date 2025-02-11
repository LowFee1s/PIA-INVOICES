const { parentPort, workerData } = require('worker_threads');
const faceapi = require('face-api.js');

const { inputDescriptor, employees } = workerData;

let matchedEmployee = null;

for (const employee of employees) {
  const dbDescriptor = Object.values(employee.face_descriptor);
  const distance = faceapi.euclideanDistance(inputDescriptor, dbDescriptor);
  
  if (distance < 0.6) {
    matchedEmployee = employee;
    break;
  }
}

if (matchedEmployee) {
  parentPort.postMessage({ matchedEmployee });
} else {
  parentPort.postMessage({ error: '❌ No se encontró coincidencia facial' });
}
