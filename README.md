# Catálogo de Productos Veganos - JumVo 🥦

Este proyecto fue desarrollado como parte de una prueba técnica para mostrar un catálogo de productos veganos del supermercado Jumbo. La aplicación está compuesta por un frontend desarrollado en Angular y una API construida con Express y MongoDB.

## Tecnologías utilizadas

* **Frontend:** Angular 20
* **Backend:** Node.js + Express
* **Base de datos:** MongoDB
* **Otros:** HTML, CSS, TypeScript

## Funcionalidades principales

* Web scraping a Jumbo.
* Parsear datos y poblar DB.
* Visualización de productos veganos categorizados.
* Filtros por categoría.
* Backend que centraliza la consulta a la API externa y el acceso a MongoDB.
* API con llave pública y privada (CRUD a los productos en DB)
* Cumple con buenas prácticas: el frontend no hace peticiones directas desde el HTML.

## Estructura del proyecto


```
├── api/            # Backend en Express + MongoDB
├── src/            # Código fuente de Angular
```

## Cómo ejecutar el proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/aaguirreu/catalogo-vegano.git
cd catalogo-vegano
```

### 2. Instalar dependencias

```bash
npm install
cd api
npm install
```

### 3. Iniciar la API

Desde la carpeta `api/`:

```bash
npm start
```

Esto levanta el servidor backend en `http://localhost:3000`.

### 4. Iniciar el frontend Angular

Desde la raíz del proyecto:

```bash
ng serve
```

---

## Consideraciones

* MongoDB se usa para almacenar los productos obtenidos desde la API de Jumbo.
* El diseño es fácilmente extensible y preparado para despliegue en servicios como Render (API) o Vercel (Front-End).