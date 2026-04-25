import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss',
})
export class ProductComponent implements OnInit {

  activeTab: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';

  activeProducts: any[] = [];
  inactiveProducts: any[] = [];
  wiringTypes: any[] = [];
searchText: string = '';

filteredActiveProducts: any[] = [];
filteredInactiveProducts: any[] = [];
  showAdd = false;
  showEdit = false;
  showView = false;

  showConfirm = false;
  confirmAction: 'ACTIVATE' | 'DEACTIVATE' | null = null;
  confirmProductId: number | null = null;
  confirmMessage = '';

  selectedProduct: any = null;

  productForm: any = {
    product_name: '',
    category: '',
    mod_size: null,
    price: '',
    wiring_type_id: null,
    zigbee_type: null,
    images: []
  };

  constructor(
    private admin: AdminService,
    private loader: LoaderService   // 🔥 add this
  ) {}

  ngOnInit(): void {
    this.activeTab = 'ACTIVE';
    this.loadAllProducts();
    this.loadWiringTypes();
  }

  /* ================= LOAD PRODUCTS ================= */
  loadAllProducts(): void {
    this.loader.show();   // 🔥 START

    this.admin.getActiveProduct().subscribe({
      next: (res: any) => {
       this.activeProducts = res.resp?.data || [];
this.filteredActiveProducts = [...this.activeProducts]; // ✅

        this.admin.getInactiveProduct().subscribe({
          next: (res2: any) => {
         this.inactiveProducts = res2.resp?.data || [];
this.filteredInactiveProducts = [...this.inactiveProducts]; // ✅
            this.loader.hide();   // 🔥 END
          },
          error: () => this.loader.hide()
        });
      },
      error: () => this.loader.hide()
    });
  }

  /* ================= LOAD WIRING ================= */
  loadWiringTypes(): void {
    this.loader.show();

    this.admin.getWire().subscribe({
      next: (res: any) => {
        this.wiringTypes = res.data || res.resp?.data || [];
        this.loader.hide();
      },
      error: () => this.loader.hide()
    });
  }

  /* ================= ADD ================= */
  addProduct(): void {
    const fd = new FormData();

    console.log('WIRING TYPE ID:', this.productForm.wiring_type_id);

    Object.keys(this.productForm).forEach(key => {
      if (key !== 'images') {
        fd.append(key, this.productForm[key]);
      }
    });

    this.productForm.images.forEach((f: File) => {
      fd.append('images', f);
    });

    this.loader.show();

    this.admin.addProduct(fd).subscribe({
      next: () => {
        alert('Product added successfully');
        this.close();
        this.loadAllProducts();
        this.loader.hide();
      },
      error: () => this.loader.hide()
    });
  }

  /* ================= UPDATE ================= */
  updateProduct(): void {
    const fd = new FormData();

    Object.keys(this.productForm).forEach(key => {
      if (key !== 'images') {
        fd.append(key, this.productForm[key]);
      }
    });

    this.productForm.images.forEach((f: File) => {
      fd.append('images', f);
    });

    this.loader.show();

    this.admin.UpdateProduct(this.productForm.id, fd).subscribe({
      next: () => {
        alert('Product updated successfully');
        this.close();
        this.loadAllProducts();
        this.loader.hide();
      },
      error: () => this.loader.hide()
    });
  }

  /* ================= ACTIVATE / DEACTIVATE ================= */
  confirmYes(): void {
    if (!this.confirmProductId || !this.confirmAction) return;

    const id = this.confirmProductId;
    const action = this.confirmAction;

    this.resetConfirm();
    this.loader.show();   // 🔥 START

    if (action === 'DEACTIVATE') {
      this.admin.inactiveProduct(id).subscribe({
        next: () => this.loadAllProducts(),
        error: () => this.loader.hide()
      });
    }

    if (action === 'ACTIVATE') {
      this.admin.activeProduct(id).subscribe({
        next: () => this.loadAllProducts(),
        error: () => this.loader.hide()
      });
    }
  }

  /* ================= REMAINING (NO CHANGE) ================= */

  switchTab(tab: 'ACTIVE' | 'INACTIVE'): void {
    this.activeTab = tab;
  }

  openAdd(): void {
    this.resetForm();
    this.showAdd = true;
  }

  onFileChange(event: any): void {
    this.productForm.images = Array.from(event.target.files);
  }

  viewProduct(p: any): void {
    this.selectedProduct = p;
    this.showView = true;
  }

  getWiringName(id: number): string {
    const wiring = this.wiringTypes.find(w => w.id === id);
    return wiring ? wiring.wiring_name : '-';
  }

  editProduct(p: any): void {
    this.productForm = {
      id: p.id,
      product_name: p.product_name,
      category: p.category,
      mod_size: p.mod_size,
      price: p.price,
      wiring_type_id: p.wiring_type_id,
      zigbee_type: p.zigbee_type,
      images: []
    };
    this.showEdit = true;
  }

  openConfirm(action: 'ACTIVATE' | 'DEACTIVATE', id: number): void {
    this.confirmAction = action;
    this.confirmProductId = id;
    this.confirmMessage =
      action === 'DEACTIVATE'
        ? 'Are you sure you want to deactivate this product?'
        : 'Are you sure you want to activate this product?';

    this.showConfirm = true;
  }

  confirmNo(): void {
    this.resetConfirm();
  }

  resetConfirm(): void {
    this.showConfirm = false;
    this.confirmAction = null;
    this.confirmProductId = null;
    this.confirmMessage = '';
  }

  resetForm(): void {
    this.productForm = {
      product_name: '',
      category: '',
      mod_size: null,
      price: '',
      wiring_type_id: null,
      zigbee_type: null,
      images: []
    };
  }

  close(): void {
    this.showAdd = false;
    this.showEdit = false;
    this.showView = false;
    this.selectedProduct = null;
  }

  previewImage: string | null = null;

  openImagePreview(img: string): void {
    this.previewImage = img;
  }

  closeImagePreview(): void {
    this.previewImage = null;
  }

  filterProducts() {
  const search = this.searchText.toLowerCase();

  this.filteredActiveProducts = this.activeProducts.filter(p =>
    p.product_name?.toLowerCase().includes(search) ||
    p.category?.toLowerCase().includes(search)
  );

  this.filteredInactiveProducts = this.inactiveProducts.filter(p =>
    p.product_name?.toLowerCase().includes(search) ||
    p.category?.toLowerCase().includes(search)
  );
}
}