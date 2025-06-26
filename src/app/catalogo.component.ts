import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
    this.cargarProductos(); // tu lógica de inicio aquí
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

  noHayMas = false;

  cargarMas() {
    if (this.noHayMas || this.loading) return;

    this.offset += this.limit;
    this.loading = true;

    const observable = this.categoriaSeleccionada
      ? this.productosService.getProductosPorCategoria(this.categoriaSeleccionada, this.offset, this.limit)
      : this.productosService.getProductos(this.offset, this.limit);

    observable.subscribe({
      next: (data) => {
        if (data.length < this.limit) this.noHayMas = true;

        const nuevos = data.filter(nuevo =>
          !(this.productosBusqueda ?? this.productos).some(p => p._id === nuevo._id)
        );

        if (this.categoriaSeleccionada) {
          this.productosBusqueda = [...(this.productosBusqueda ?? []), ...nuevos];
        } else {
          this.productos = [...this.productos, ...nuevos];
        }

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
    this.busqueda = '';
    this.loading = true;
    this.offset = 0;

    this.productosService.getProductosPorCategoria(cat, this.offset, this.limit).subscribe({
      next: (data) => {
        this.productosBusqueda = data;
        this.loading = false;
        this.noHayMas = data.length < this.limit;
      },
      error: () => {
        this.error = 'Error al cargar productos por categoría';
        this.loading = false;
      }
    });
  }

  buscarProductos() {
    const texto = this.busqueda.trim();
    if (!texto) {
      this.productosBusqueda = null;
      return;
    }

    this.categoriaSeleccionada = '';
    this.loading = true;
    this.productosService.searchProductos(texto).subscribe({
      next: (data) => {
        this.productosBusqueda = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al buscar productos';
        this.loading = false;
      }
    });
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

  @ViewChild('scrollable') scrollable!: ElementRef<HTMLDivElement>;

  onScrollProductos() {
    const div = this.scrollable.nativeElement;
    if (div.scrollTop + div.clientHeight >= div.scrollHeight) {
      if (!this.loading && !this.noHayMas) {
        this.cargarMas();
      }
    }
  }

  toggleCategorias() {
    this.categoriasAbiertas = !this.categoriasAbiertas;
  }
}
