import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss',
})
export class ProductComponent implements OnInit {

  /* ================= STATE ================= */
  activeTab: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';

  activeProducts: any[] = [];
  inactiveProducts: any[] = [];

  wiringTypes: any[] = [];   // 🔑 wiring dropdown data

  /* ================= MODALS ================= */
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

  constructor(private admin: AdminService) {}

  /* ================= INIT ================= */
  ngOnInit(): void {
    this.activeTab = 'ACTIVE';
    this.loadAllProducts();
    this.loadWiringTypes(); // 👈 load wiring list once
  }

  /* ================= API ================= */
  loadAllProducts(): void {
    this.admin.getActiveProduct().subscribe((res: any) => {
      this.activeProducts = res.resp?.data || [];
    });

    this.admin.getInactiveProduct().subscribe((res: any) => {
      this.inactiveProducts = res.resp?.data || [];
    });
  }

  loadWiringTypes(): void {
    this.admin.getWire().subscribe((res: any) => {
      this.wiringTypes = res.data || res.resp?.data || [];
    });
  }

  /* ================= TABS ================= */
  switchTab(tab: 'ACTIVE' | 'INACTIVE'): void {
    this.activeTab = tab;
  }

  /* ================= ADD ================= */
  openAdd(): void {
    this.resetForm();
    this.showAdd = true;
  }

  onFileChange(event: any): void {
    this.productForm.images = Array.from(event.target.files);
  }

  addProduct(): void {
    const fd = new FormData();

    Object.keys(this.productForm).forEach(key => {
      if (key !== 'images') {
        fd.append(key, this.productForm[key]);
      }
    });

    this.productForm.images.forEach((f: File) => {
      fd.append('images', f);
    });

    this.admin.addProduct(fd).subscribe(() => {
      alert('Product added successfully');
      this.close();
      this.loadAllProducts();
    });
  }

  /* ================= VIEW ================= */
  viewProduct(p: any): void {
    this.selectedProduct = p;
    this.showView = true;
  }

  getWiringName(id: number): string {
    const wiring = this.wiringTypes.find(w => w.id === id);
    return wiring ? wiring.wiring_name : '-';
  }

  /* ================= EDIT ================= */
  editProduct(p: any): void {

    console.log('">>>>>>>>',p);
    
    this.productForm = {
      id: p.id,
      product_name: p.product_name,
      category: p.category,
      mod_size: p.mod_size,
      price: p.price,
      wiring_type_id: p.wiring_type_id, // 👈 preselect
      zigbee_type: p.zigbee_type,
      images: []
    };
    this.showEdit = true;
  }

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

    console.log(fd);
    

    this.admin.UpdateProduct(this.productForm.id, fd).subscribe(() => {
      alert('Product updated successfully');
      this.close();
      this.loadAllProducts();
    });
  }

  /* ================= CONFIRM ================= */
  openConfirm(action: 'ACTIVATE' | 'DEACTIVATE', id: number): void {
    this.confirmAction = action;
    this.confirmProductId = id;
    this.confirmMessage =
      action === 'DEACTIVATE'
        ? 'Are you sure you want to deactivate this product?'
        : 'Are you sure you want to activate this product?';

    this.showConfirm = true;
  }

  confirmYes(): void {
    if (!this.confirmProductId || !this.confirmAction) return;

    const id = this.confirmProductId;
    const action = this.confirmAction;

    this.resetConfirm();

    if (action === 'DEACTIVATE') {
      const product = this.activeProducts.find(p => p.id === id);
      this.activeProducts = this.activeProducts.filter(p => p.id !== id);
      if (product) this.inactiveProducts.unshift(product);

      this.admin.inactiveProduct(id).subscribe({
        error: () => this.loadAllProducts()
      });
    }

    if (action === 'ACTIVATE') {
      const product = this.inactiveProducts.find(p => p.id === id);
      this.inactiveProducts = this.inactiveProducts.filter(p => p.id !== id);
      if (product) this.activeProducts.unshift(product);

      this.admin.activeProduct(id).subscribe({
        error: () => this.loadAllProducts()
      });
    }
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

  /* ================= UTILS ================= */
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

}
