const { MongoClient } = require("mongodb");
require('dotenv').config();
const productos = require("./productos.json"); // <- es un array []
const crypto = require('crypto');

const uri = process.env.MONGODB_URI || ""; // Asegúrate de tener esta variable de entorno
const dbName = "catalogo"; // Cambia si tu base de datos tiene otro nombre

(async () => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("productos");
    // Crea un índice único en el campo id
    await collection.createIndex({ id: 1 }, { unique: true });
    // Limpia la colección antes de importar (opcional)
    await collection.deleteMany({});
    // Inserta todos los productos
    await collection.insertMany(productos);
    // --- Generar e insertar API keys ---
    const apikeysCollection = db.collection("apikeys");
    await apikeysCollection.deleteMany({}); // Limpia las apikeys previas (opcional)
    const publicKey = crypto.randomBytes(32).toString('hex');
    const privateKey = crypto.randomBytes(32).toString('hex');
    await apikeysCollection.insertMany([
      { key: publicKey, type: 'public', active: true },
      { key: privateKey, type: 'private', active: true }
    ]);
    console.log("✅ Productos importados correctamente a MongoDB.");
    console.log("🔑 API key pública:", publicKey);
    console.log("🔑 API key privada:", privateKey);
  } catch (error) {
    console.error("❌ Error importando productos:", error);
  } finally {
    await client.close();
  }
})();
