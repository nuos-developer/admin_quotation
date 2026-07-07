import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { AdminService } from '../../../core/services/admin.service';
import { LoaderService } from '../../../core/services/loader.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule, NgMultiSelectDropDownModule],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss',
})
export class ProductComponent implements OnInit {

  activeTab: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';

  activeProducts: any[] = [];
  inactiveProducts: any[] = [];
  wiringTypes: any[] = [];
  searchText: string = '';
  categories: any[] = [];

  filteredActiveProducts: any[] = [];
  filteredInactiveProducts: any[] = [];
  showAdd = false;
  showEdit = false;
  showView = false;
  submitted = false;


  showConfirm = false;
  confirmAction: 'ACTIVATE' | 'DEACTIVATE' | null = null;
  selectedCategoryId: number | null = null;
  confirmProductId: number | null = null;
  confirmMessage = '';
  showModal: boolean = false;
  selectedProduct: any = null;
  categorySortOrder: 'asc' | 'desc' = 'asc';

  productForm: any = {
    product_name: '',
    category: '',
    mod_size: null,
    price: '',
    wiring_type_id: null,
    category_id: null,
    zigbee_type: null,
    switch_load_count: null,
    description: null,
    images: []
  };

  selectedCategories: any[] = [];

  dropdownSettings = {
    singleSelection: false,
    idField: 'id',
    textField: 'category_type',
    selectAllText: 'Select All',
    unSelectAllText: 'Unselect All',
    itemsShowLimit: 3,
    allowSearchFilter: true
  };

  private readonly newProperty = this;

  constructor(
    private admin: AdminService,
    private loader: LoaderService,
    private toast: ToastService, // 🔥 add this
  ) { }

  ngOnInit(): void {
    this.activeTab = 'ACTIVE';
    this.loadAllProducts();
    this.loadWiringTypes();
    this.loadCategories();
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

  loadCategories(): void {
    this.loader.show();

    this.admin.getCategories().subscribe({
      next: (res: any) => {
        this.categories = res.data || res.resp?.data || [];
        this.loader.hide();
      },
      error: () => this.loader.hide()
    });
  }

  /* ================= ADD ================= */
  addProduct(): void {

    if (!this.validateForm()) {
      return;
    }

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
        this.toast.show('Product Created successfully', 'success');
        this.loader.hide();
        this.close();
        this.loadAllProducts();
      },
      error: () => {
        this.toast.show('Failed to create Product', 'error');
        this.loader.hide();
      }
    });
  }

  /* ================= UPDATE ================= */
  updateProduct(): void {

    if (!this.validateForm()) {
      return;
    }

    const fd = new FormData();

    fd.append('product_name', this.productForm.product_name);
    fd.append('category', this.productForm.category);
    fd.append('mod_size', this.productForm.mod_size || '');
    fd.append('price', this.productForm.price);
    fd.append('wiring_type_id', this.productForm.wiring_type_id);
    fd.append('category_id', this.productForm.category_id);
    fd.append('zigbee_type', this.productForm.zigbee_type || '');
    fd.append('switch_load_count', this.productForm.switch_load_count);
    fd.append('description', this.productForm.description || '');

    if (this.productForm.images?.length) {

      this.productForm.images.forEach((file: File) => {
        fd.append('images', file);
      });
    }

    fd.forEach((value, key) => {
      console.log(key, value);
    });

    this.loader.show();

    this.admin.UpdateProduct(
      this.productForm.id,
      fd
    ).subscribe({
      next: () => {

        this.toast.show(
          'Product Updated successfully',
          'success'
        );

        this.loader.hide();
        this.close();
        this.loadAllProducts();
      },

      error: (err) => {

        console.log(err);

        this.toast.show(
          'Failed to Update Product',
          'error'
        );

        this.loader.hide();
      }
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
        next: () => {
          this.loader.hide();
          this.toast.show('Product Inactive successfully', 'success');
          this.close();
          this.loadAllProducts();
        },
        error: () => {
          this.toast.show('Failed to Inactive Product', 'error');
          this.loader.hide();
        }
      });
    }

    if (action === 'ACTIVATE') {
      this.admin.activeProduct(id).subscribe({
        next: () => {
          this.toast.show('Product Active successfully', 'success');
          this.loader.hide();
          this.close();
          this.loadAllProducts();
        },
        error: () => {
          this.toast.show('Failed to Active Product', 'error');
          this.loader.hide();
        }
      });
    }
  }

  /* ================= REMAINING (NO CHANGE) ================= */

  switchTab(tab: 'ACTIVE' | 'INACTIVE'): void {
    this.activeTab = tab;
  }

  openAdd(): void {
    this.resetForm();
    this.showModal = true;
    this.showAdd = true;
  }

  onFileChange(event: any): void {
    this.productForm.images = Array.from(event.target.files);
  }

  viewProduct(p: any): void {
    this.selectedProduct = p;
    this.showModal = true;
    this.showView = true;
  }

  getWiringName(id: number): string {
    const wiring = this.wiringTypes.find(w => w.id === id);
    return wiring ? wiring.wiring_name : '-';
  }

  getCategory(id: number): string {
    const category = this.categories.find(c => c.id === id);
    return category ? category.category_type : '-';
  }

  editProduct(p: any): void {

    this.productForm = {
      id: p.id,
      product_name: p.product_name,
      category: p.category,
      mod_size: p.mod_size,
      price: p.price,
      wiring_type_id: p.wiring_type_id,
      category_id: p.category_id,
      zigbee_type: p.zigbee_type,
      switch_load_count: p.switch_load_count,
      description: p.description,

      // New images selected by user
      images: [],

      // Existing images
      image_urls: p.image_urls || []
    };

    this.showModal = true;
    this.showEdit = true;
  }
  // editProduct(p: any): void {

  //   console.log('EDIT PRODUCT:', p);

  //   this.productForm = {
  //     id: p.id,
  //     product_name: p.product_name,
  //     category: p.category,
  //     mod_size: p.mod_size,
  //     price: p.price,
  //     wiring_type_id: p.wiring_type_id,
  //     category_id: p.category_id,
  //     zigbee_type: p.zigbee_type,
  //     switch_load_count: p.switch_load_count,
  //     description: p.description,

  //     // IMPORTANT
  //     images: []
  //   };

  //   console.log(
  //     'PRODUCT FORM:',
  //     this.productForm
  //   );

  //   // OPEN MODAL
  //   this.showModal = true;

  //   // OPEN EDIT FORM
  //   this.showEdit = true;
  // }

  openConfirm(action: 'ACTIVATE' | 'DEACTIVATE', id: number): void {
    this.confirmAction = action;
    this.confirmProductId = id;
    this.confirmMessage =
      action === 'DEACTIVATE'
        ? 'Are you sure you want to inactivate this product?'
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
      category_id: null,
      zigbee_type: null,
      switch_load_count: null,
      description: null,
      images: []
    };
  }

  close(): void {
    this.showAdd = false;
    this.showEdit = false;
    this.showView = false;
    this.selectedProduct = null;
    this.showModal = false;
  }

  previewImage: string | null = null;

  openImagePreview(img: string): void {
    this.previewImage = img;
  }

  closeImagePreview(): void {
    this.previewImage = null;
  }

  filterProducts(): void {
    const search = this.searchText.toLowerCase().trim();

    this.filteredActiveProducts = this.activeProducts.filter(p =>
      (p.product_name || '').toLowerCase().includes(search) ||
      (p.category || '').toLowerCase().includes(search)
    );

    this.filteredInactiveProducts = this.inactiveProducts.filter(p =>
      (p.product_name || '').toLowerCase().includes(search) ||
      (p.category || '').toLowerCase().includes(search)
    );
  }
  closeModal() {
    this.showModal = false;
    this.selectedProduct = null;
  }

  getCategoryName(category: string): string {

    if (!category) return '-';

    return category === 'NUOS'
      ? 'NUOS Products'
      : 'Non-NUOS Products';
  }

  validateForm(): boolean {

    this.newProperty.submitted = true;

    if (!this.productForm.product_name?.trim()) {
      return false;
    }

    if (!this.productForm.category) {
      return false;
    }

    if (
      this.productForm.price === '' ||
      this.productForm.price === null ||
      this.productForm.price === undefined
    ) {
      return false;
    }

    if (!this.productForm.wiring_type_id) {
      return false;
    }

    return true;
  }

  sortByCategory() {

    this.categorySortOrder =
      this.categorySortOrder === 'asc' ? 'desc' : 'asc';

    const direction = this.categorySortOrder === 'asc' ? 1 : -1;

    this.filteredActiveProducts.sort((a: any, b: any) =>
      a.category.localeCompare(b.category) * direction
    );

    this.filteredInactiveProducts.sort((a: any, b: any) =>
      a.category.localeCompare(b.category) * direction
    );

  }



  filterCategory(): void {

  const search = this.searchText.toLowerCase().trim();

  const filter = (products: any[]) =>
    products.filter((p: any) => {

      // Search by product name
      const matchesSearch =
        !search ||
        (p.product_name || '').toLowerCase().includes(search);

      // Filter by selected category
      const matchesCategory =
        this.selectedCategoryId === null ||
        p.category_id === this.selectedCategoryId;

      return matchesSearch && matchesCategory;
    });

  this.filteredActiveProducts = filter(this.activeProducts);
  this.filteredInactiveProducts = filter(this.inactiveProducts);
}

}