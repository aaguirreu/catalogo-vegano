import { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || "";
const client = new MongoClient(uri);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await client.connect();
    const db = client.db("catalogo");
    if (req.method === "GET") {
      const { id } = req.query;
      const producto = await db.collection("productos").findOne({ _id: new ObjectId(id as string) });
      if (!producto) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      res.status(200).json(producto);
    } else {
      res.status(405).json({ error: "Método no permitido" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo producto" });
  }
}
