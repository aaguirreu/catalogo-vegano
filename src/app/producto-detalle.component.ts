import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductosService } from './productos.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './producto-detalle.component.html',
  styleUrls: ['./producto-detalle.component.scss']
})
export class ProductoDetalleComponent implements OnDestroy {
  producto: any;
  private sub: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productosService: ProductosService
  ) {
    this.sub = this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.productosService.getProductoPorSlug(slug).subscribe(prod => {
          this.producto = prod;
        });
      }
    });
  }

  volver() {
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
