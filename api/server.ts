import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();
const port = process.env['PORT'] || 3001;
const uri = process.env['MONGODB_URI'] || '';
const client = new MongoClient(uri);

app.use(cors());
app.use(express.json());

const api = express.Router();

// Endpoint para obtener todos los productos
api.get('/productos', function (req, res) {
  client.connect().then(() => {
    const db = client.db('catalogo');
    db.collection('productos').find().toArray()
      .then(productos => res.status(200).json(productos))
      .catch(() => res.status(500).json({ error: 'Error obteniendo productos' }));
  }).catch(() => res.status(500).json({ error: 'Error conectando a la base de datos' }));
});

// Endpoint para obtener un producto por id
api.get('/producto/:id', function (req, res) {
  client.connect().then(() => {
    const db = client.db('catalogo');
    const { id } = req.params;
    db.collection('productos').findOne({ _id: new ObjectId(id) })
      .then(producto => {
        if (!producto) {
          return res.status(404).json({ error: 'Producto no encontrado' });
        }
        return res.status(200).json(producto);
      })
      .catch(() => res.status(500).json({ error: 'Error obteniendo producto' }));
  }).catch(() => res.status(500).json({ error: 'Error conectando a la base de datos' }));
});

app.use('/api', api);

// Cerrar la conexión de MongoDB al terminar el proceso
process.on('SIGINT', async () => {
  await client.close();
  console.log('Conexión a MongoDB cerrada');
  process.exit(0);
});

app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});
