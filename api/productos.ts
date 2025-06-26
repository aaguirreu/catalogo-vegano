import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "";
const client = new MongoClient(uri);

export async function getProductos(req, res) {
  try {
    await client.connect();
    const db = client.db("catalogo");
    if (req.method === "GET") {
      const { q } = req.query;
      let filter = {};
      if (q) {
        const regex = new RegExp(q, 'i');
        filter = {
          $or: [
            { nombre: regex },
            { descripcion: regex },
            { marca: regex },
            { categoria: regex }
          ]
        };
      }
      const productos = await db.collection("productos").find(filter).toArray();
      res.status(200).json(productos);
    } else {
      res.status(405).json({ error: "Método no permitido" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo productos" });
  }
}
