import { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "";
const client = new MongoClient(uri);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await client.connect();
    const db = client.db("catalogo");
    if (req.method === "GET") {
      // Obtener todos los productos
      const productos = await db.collection("productos").find().toArray();
      res.status(200).json(productos);
    } else {
      res.status(405).json({ error: "Método no permitido" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo productos" });
  }
}
