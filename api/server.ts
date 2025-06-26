import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import express, { Router } from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

const app = express();
const port = process.env['PORT'] || 3001;
const uri = process.env['MONGODB_URI'] || '';
const client = new MongoClient(uri);

app.use(cors());
app.use(express.json());

// Middleware para validar API key en la base de datos
async function validateApiKey(req, res, next, type) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key ausente' });
  }
  try {
    await client.connect();
    const db = client.db('catalogo');
    const keyDoc = await db.collection('apikeys').findOne({ key: apiKey, type, active: true });
    if (!keyDoc) {
      return res.status(401).json({ error: 'API key inválida o inactiva' });
    }
    next();
    return;
  } catch (err) {
    return res.status(500).json({ error: 'Error validando API key' });
  }
}

async function requirePrivateApiKey(req, res, next) {
  await validateApiKey(req, res, next, 'private');
}

async function requirePublicApiKey(req, res, next) {
  await validateApiKey(req, res, next, 'public');
}

const api: Router = express.Router();

// Endpoint para obtener la API key pública desde la base de datos
api.get('/public-key', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('catalogo');
    const keyDoc = await db.collection('apikeys').findOne({ type: 'public', active: true });
    if (!keyDoc) {
      res.status(404).json({ error: 'API key pública no configurada' });
      return;
    }
    res.status(200).json({ publicKey: keyDoc.key });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo API key pública' });
  }
});

// Endpoints públicos (requieren API key pública)
api.get('/productos', requirePublicApiKey, function (req, res) {
  client.connect().then(() => {
    const db = client.db('catalogo');
    db.collection('productos').find().toArray()
      .then(productos => res.status(200).json(productos))
      .catch(() => res.status(500).json({ error: 'Error obteniendo productos' }));
  }).catch(() => res.status(500).json({ error: 'Error conectando a la base de datos' }));
});

// Endpoint para obtener un producto por id
api.get('/producto/:id', requirePublicApiKey, function (req, res) {
  client.connect().then(() => {
    const db = client.db('catalogo');
    const { id } = req.params;
    db.collection('productos').findOne({ id: id })
      .then(producto => {
        if (!producto) {
          return res.status(404).json({ error: 'Producto no encontrado' });
        }
        return res.status(200).json(producto);
      })
      .catch(() => res.status(500).json({ error: 'Error obteniendo producto' }));
  }).catch(() => res.status(500).json({ error: 'Error conectando a la base de datos' }));
});

// Endpoints protegidos (requieren API key privada)
api.post('/productos', requirePrivateApiKey, function (req, res) {
  client.connect().then(() => {
    const db = client.db('catalogo');
    const newProduct = req.body;
    if (!newProduct || !newProduct.id) {
      return res.status(400).json({ error: 'El producto debe tener un id' });
    }
    db.collection('productos').insertOne(newProduct)
      .then(() => res.status(201).json({ message: 'Producto creado' }))
      .catch((err) => {
        return res.status(500).json({ error: err.message });
      });
  }).catch(() => res.status(500).json({ error: 'Error conectando a la base de datos' }));
});

// Endpoint para actualización parcial de un producto
api.patch('/producto/:id', requirePrivateApiKey, function (req, res) {
  client.connect().then(() => {
    const db = client.db('catalogo');
    const { id } = req.params;
    const updateData = req.body;
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Payload vacío' });
    }
    db.collection('productos').updateOne(
      { id: id },
      { $set: updateData }
    )
      .then(result => {
        if (result.matchedCount === 0) {
          return res.status(404).json({ error: 'Producto no encontrado' });
        }
        return res.status(200).json({ message: 'Producto actualizado' });
      })
      .catch(() => res.status(500).json({ error: 'Error actualizando producto' }));
  }).catch(() => res.status(500).json({ error: 'Error conectando a la base de datos' }));
});

// Endpoint para eliminar un producto
api.delete('/producto/:id', requirePrivateApiKey, function (req, res) {
  client.connect().then(() => {
    const db = client.db('catalogo');
    const { id } = req.params;
    db.collection('productos').deleteOne({ id: id })
      .then(result => {
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Producto no encontrado' });
        }
        return res.status(200).json({ message: 'Producto eliminado' });
      })
      .catch(() => res.status(500).json({ error: 'Error eliminando producto' }));
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
