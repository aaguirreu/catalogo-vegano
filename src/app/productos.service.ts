import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { switchMap, shareReplay } from 'rxjs/operators';

export interface Producto {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precioOriginal: number;
  stock: boolean;
  imagen?: string;
  categoria?: string;
  categorias?: string[];
  marca?: string;
  slug?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductosService {
  // private apiUrl = 'https://catalogo-vegano.onrender.com/api/productos';
  private apiUrl = 'http://localhost:3001/api/productos';
  // private publicKeyUrl = 'https://catalogo-vegano.onrender.com/api/public-key';
  private publicKeyUrl = 'http://localhost:3001/api/public-key';
  private publicKey$: Observable<string>;

  constructor(private http: HttpClient) {
    this.publicKey$ = this.http.get<{ publicKey: string }>(this.publicKeyUrl)
      .pipe(
        switchMap(res => of(res.publicKey)),
        shareReplay(1)
      );
  }

  getProductos(offset: number = 0, limit: number = 40): Observable<Producto[]> {
    return this.publicKey$.pipe(
      switchMap(key => {
        const headers = new HttpHeaders({ 'x-api-key': key });
        const url = `${this.apiUrl}?offset=${offset}&limit=${limit}`;
        return this.http.get<Producto[]>(url, { headers });
      })
    );
  }

  searchProductos(query: string): Observable<Producto[]> {
    return this.publicKey$.pipe(
      switchMap(key => {
        const headers = new HttpHeaders({ 'x-api-key': key });
        const url = `${this.apiUrl}?q=${encodeURIComponent(query)}`;
        return this.http.get<Producto[]>(url, { headers });
      })
    );
  }

  getProductoPorSlug(slug: string): Observable<Producto | undefined> {
    return this.getProductos().pipe(
      switchMap((productos) => of(productos.find((p) => p.slug === slug)))
    );
  }
}
