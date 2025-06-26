import { Routes } from '@angular/router';
import { CatalogoComponent } from './catalogo.component';
import { ProductoDetalleComponent } from './producto-detalle.component';

export const routes: Routes = [
  { path: '', component: CatalogoComponent },
  { path: 'producto/:slug', component: ProductoDetalleComponent },
];
