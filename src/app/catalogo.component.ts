import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductosService, Producto } from './productos.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.scss',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule]
})
export class CatalogoComponent implements OnInit {
  productos: Producto[] = [];
  loading = true;
  error = '';
  offset = 0;
  limit = 20;
  productosPorFila = 5;
  categorias: string[] = [];
  categoriaSeleccionada: string = '';
  busqueda: string = '';
  productosBusqueda: Producto[] | null = null;
  categoriasAbiertas = false;

  constructor(private productosService: ProductosService) {}

  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos() {
    this.loading = true;
    this.productosService.getProductos(this.offset, this.limit).subscribe({
      next: (data) => {
        this.productos = data;
        // Extraer categorías únicas de 'categoria' y 'categorias' (array)
        const todasCategorias = data.flatMap(p => {
          if (Array.isArray(p.categorias)) return p.categorias;
          if (typeof p.categoria === 'string') return [p.categoria];
          return [];
        }).filter((c): c is string => !!c);
        this.categorias = Array.from(new Set(todasCategorias)).sort();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar productos';
        this.loading = false;
      }
    });
  }

  cargarMas() {
    this.offset += this.limit;
    this.loading = true;
    this.productosService.getProductos(this.offset, this.limit).subscribe({
      next: (data) => {
        const nuevos = data.filter(nuevo => !this.productos.some(p => p._id === nuevo._id));
        this.productos = [...this.productos, ...nuevos];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar productos';
        this.loading = false;
      }
    });
  }

  seleccionarCategoria(cat: string) {
    this.categoriaSeleccionada = cat;
  }

  buscarProductos() {
    const texto = this.busqueda.trim().toLowerCase();
    if (!texto) {
      this.productosBusqueda = null;
      return;
    }
    this.productosBusqueda = this.productos.filter(p =>
      p.nombre.toLowerCase().includes(texto) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(texto))
    );
  }

  getFilas(): Producto[][] {
    let productosFiltrados = this.categoriaSeleccionada
      ? this.productos.filter(p => {
          if (Array.isArray(p.categorias)) return p.categorias.includes(this.categoriaSeleccionada);
          return p.categoria === this.categoriaSeleccionada;
        })
      : this.productos;
    const filas: Producto[][] = [];
    for (let i = 0; i < productosFiltrados.length; i += this.productosPorFila) {
      filas.push(productosFiltrados.slice(i, i + this.productosPorFila));
    }
    return filas;
  }

  // Devuelve los productos filtrados por categoría
  productosFiltrados(): Producto[] {
    let base = this.productosBusqueda !== null ? this.productosBusqueda : this.productos;
    if (!this.categoriaSeleccionada) return base;
    return base.filter(p => {
      if (Array.isArray(p.categorias)) return p.categorias.includes(this.categoriaSeleccionada);
      return p.categoria === this.categoriaSeleccionada;
    });
  }

  toggleCategorias() {
    this.categoriasAbiertas = !this.categoriasAbiertas;
  }
}
