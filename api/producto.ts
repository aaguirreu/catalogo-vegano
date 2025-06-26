import { config } from 'dotenv';
config({ path: '../.env' });
import { MongoClient } from 'mongodb';

const uri = process.env['MONGODB_URI'] || "";
const client = new MongoClient(uri);

export async function productoHandler(req, res) {
  try {
    await client.connect();
    const db = client.db("catalogo");
    if (req.method === "GET") {
      const { id } = req.query;
      const producto = await db.collection("productos").findOne({ id: id });
      if (!producto) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      return res.status(200).json(producto);
    } else if (req.method === "PUT") {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: "Falta el parámetro id" });
      }
      const updateData = req.body;
      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "Payload vacío" });
      }
      const result = await db.collection("productos").updateOne(
        { id: id },
        { $set: updateData }
      );
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      return res.status(200).json({ message: "Producto actualizado" });
    } else {
      return res.status(405).json({ error: "Método no permitido" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Error obteniendo producto" });
  }
}
