const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Cargar la clave de servicio
const serviceAccount = require("./credenciales.json"); // Asegúrate de tener este archivo generado desde Firebase Console

// Inicializar Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Cargar tus productos desde el archivo JSON
const productos = require("./productos.json"); // <- es un array []

(async () => {
  const batch = db.batch();

  productos.forEach((producto) => {
    const docRef = db.collection("productos").doc(producto.id);
    batch.set(docRef, producto);
  });

  await batch.commit();
  console.log("✅ Productos importados correctamente.");
})();
