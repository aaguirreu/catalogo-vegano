const { MongoClient } = require("mongodb");
require('dotenv').config();
const productos = require("./productos.json"); // <- es un array []

const uri = process.env.MONGODB_URI || ""; // Asegúrate de tener esta variable de entorno
const dbName = "catalogo"; // Cambia si tu base de datos tiene otro nombre

(async () => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("productos");
    // Limpia la colección antes de importar (opcional)
    await collection.deleteMany({});
    // Inserta todos los productos
    await collection.insertMany(productos);
    console.log("✅ Productos importados correctamente a MongoDB.");
  } catch (error) {
    console.error("❌ Error importando productos:", error);
  } finally {
    await client.close();
  }
})();
