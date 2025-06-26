const axios = require("axios");
const fs = require("fs");
const cliProgress = require("cli-progress");

const endpoint = "https://be-reg-groceries-bff-jumbo.ecomm.cencosud.com/catalog/plp";
const detalleEndpoint = () => "https://be-reg-groceries-bff-jumbo.ecomm.cencosud.com/catalog/pdp";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

(async () => {
  // Solo descargar la primera página (primeros 40 productos)
  // Descargar hasta 1000 productos, 40 por página
  const pageSize = 40;
  const maxProductos = 1000;
  let from = 0;
  let to = from + pageSize - 1;
  let productos = [];
  let total = null;
  let bar = null;

  // Primer request para obtener el total
  let firstResponse;
  try {
    const body = {
      store: "jumboclj512",
      collections: [],
      fullText: "",
      brands: [],
      from: 0,
      to: 40,
      orderBy: "",
      selectedFacets: [
        {
          key: "alimentaryConditions",
          value: "Vegano"
        }
      ],
      promotionalCards: false,
      sponsoredProducts: false
    };
    firstResponse = await axios.post(endpoint, body, {
      headers: {
        "Content-Type": "application/json",
        "Apikey": "be-reg-groceries-jumbo-catalog-w54byfvkmju5"
      }
    });
    total = firstResponse.data.results || firstResponse.data.total || 0;
    // Limitar el total a 1000 productos como máximo
    total = Math.min(total, maxProductos);
    if (Array.isArray(firstResponse.data.products)) {
      productos = productos.concat(firstResponse.data.products);
    }
  } catch (err) {
    console.error(`❌ Error en request [0-40]: ${err.message}`);
    return;
  }

  // Si no hay productos, salir
  if (!total || productos.length === 0) {
    console.error('No se encontraron productos.');
    return;
  }

  // Progreso general
  bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(total, productos.length);

  // Paginación de 40 en 40 hasta 1000 productos
  for (let from = pageSize; from < total; from += pageSize) {
    const to = from + pageSize;
    const body = {
      store: "jumboclj512",
      collections: [],
      fullText: "",
      brands: [],
      from,
      to,
      orderBy: "",
      selectedFacets: [
        {
          key: "alimentaryConditions",
          value: "Vegano"
        }
      ],
      promotionalCards: false,
      sponsoredProducts: false
    };
    try {
      const response = await axios.post(endpoint, body, {
        headers: {
          "Content-Type": "application/json",
          "Apikey": "be-reg-groceries-jumbo-catalog-w54byfvkmju5"
        }
      });
      if (Array.isArray(response.data.products)) {
        productos = productos.concat(response.data.products);
        bar.update(productos.length);
      }
    } catch (err) {
      console.error(`❌ Error en request [${from}-${to}]: ${err.message}`);
    }
    await delay(500); // evitar rate limit
  }
  bar.stop();

  // Limitar productos a 1000
  productos = productos.slice(0, maxProductos);

  // --- MODIFICACIÓN: Escritura incremental para bajo uso de RAM ---
  const output = fs.createWriteStream("productos.json");
  output.write('[\n');

  // Transformar y procesar productos uno por uno
  const barDetalle = new cliProgress.SingleBar({format: 'Detalles [{bar}] {percentage}% | {value}/{total} productos'}, cliProgress.Presets.shades_classic);
  barDetalle.start(productos.length, 0);

  for (let i = 0; i < productos.length; i++) {
    const product = productos[i];
    const item = Array.isArray(product.items) && product.items.length > 0 ? product.items[0] : {};
    let prodTransformado = {
      id: product.productId,
      nombre: item.name,
      marca: product.brand,
      precio: item.price,
      precioOriginal: item.listPrice,
      stock: item.stock,
      imagen: item.images?.[0] || null,
      categorias: product.categoryNames || [],
      slug: product.slug,
      detalle: {}
    };
    try {
      const detalleResp = await axios.post(detalleEndpoint(), {
        slug: prodTransformado.slug,
        store: "jumboclj512"
      }, {
        headers: {
          "Content-Type": "application/json",
          "Apikey": "be-reg-groceries-jumbo-catalog-w54byfvkmju5"
        }
      });
      const d = detalleResp.data;
      prodTransformado.detalle = {
        descripcion: d.description || null,
        ingredientes: d.ingredients || null,
        tablaNutricional: Array.isArray(d.nutritionalTableList)
          ? d.nutritionalTableList.map(nutri => ({
              nombre: nutri.key === "Energía (kCal)" ? "Energía (kCal)" :
                      nutri.key === "Proteínas (g)" ? "Proteínas (g)" :
                      nutri.key === "Grasas Totales (g)" ? "Grasas Totales (g)" :
                      nutri.key === "Hidratos de Carbono disponibles (g)" ? "Carbohidratos (g)" :
                      nutri.key === "Azúcares totales (g)" ? "Azúcares (g)" :
                      nutri.key === "Sodio (mg)" ? "Sodio (mg)" : nutri.key,
              por100g: nutri.gramsMilliliters,
              porPorcion: nutri.onePortion
            })
          ) : null
      };
    } catch (err) {
      prodTransformado.detalle = { error: err.message };
    }
    // Escribir producto al archivo
    output.write((i > 0 ? ',\n' : '') + JSON.stringify(prodTransformado, null, 2));
    barDetalle.update(i + 1);
    await delay(200); // evitar rate limit
  }
  barDetalle.stop();
  output.write('\n]\n');
  output.end();
  console.log("🎉 Listo! Datos guardados en productos.json");
})();
