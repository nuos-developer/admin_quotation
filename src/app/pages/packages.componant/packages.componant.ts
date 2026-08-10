import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminService } from '../../core/services/admin.service';
import { LoaderService } from '../../core/services/loader.service';
import { ToastService } from '../../core/services/toast.service';

interface SwitchboardForm {
  switchboard_name: string;
  panel_mod: number | null;
  switch_board_product_id: number[];
  // UI-only state, never sent to the API
  _dropdownOpen?: boolean;
  _search?: string;
}

interface PackageForm {
  id: number | null;
  package_id: number | null;
  room_name: string;
  room_product_id: number[];
  switchboards: SwitchboardForm[];
}

@Component({
  selector: 'app-packages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './packages.componant.html',
  styleUrl: './packages.componant.scss',
})
export class PackagesComponant implements OnInit {

  packages: any[] = [];
  filteredPackages: any[] = [];

  wiringTypes: any[] = [];

  roomDropdownOpen = false;
  searchText: string = '';

  packageList: any[] = [];
  productList: any[] = [];
  panelModOptions: number[] = [2, 4, 6, 8, 10, 12];

  roomSearch = '';

  showAdd = false;
  showEdit = false;
  showView = false;
  submitted = false;

  showConfirm = false;
  confirmPackageId: number | null = null;
  confirmMessage = '';

  selectedPackage: any = null;

  form: PackageForm = this.emptyForm();

  constructor(
    private admin: AdminService,
    private loader: LoaderService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.loadPackages();
    this.loadDropdowns();
  }

  /* ================= LOAD ================= */

  loadPackages(): void {
    this.loader.show();

    this.admin.getRoomPackages().subscribe({
      next: (res: any) => {
        this.packages = res.data || [];
        this.filteredPackages = [...this.packages];
        this.loader.hide();
      },
      error: () => {
        this.toast.show('Unable to load package list.', 'error');
        this.loader.hide();
      }
    });
  }

  loadDropdowns(): void {
    this.admin.getPackages().subscribe({
      next: (res: any) => {
        this.packageList = res.data || [];
      }
    });

    this.admin.getProductName().subscribe({
      next: (res: any) => {
        this.productList = res.data || [];
      }
    });

    this.admin.getWire().subscribe({
      next: (res: any) => {
        this.wiringTypes = res.data || res.resp?.data || [];
      }
    });
  }

  /* ================= SEARCH ================= */

  filterPackages(): void {
    const search = this.searchText.toLowerCase().trim();

    if (!search) {
      this.filteredPackages = [...this.packages];
      return;
    }

    this.filteredPackages = this.packages.filter((item: any) =>
      (item.package_name || '').toLowerCase().includes(search) ||
      (item.room_name || '').toLowerCase().includes(search)
    );
  }

  /* ================= ADD ================= */

  openAdd(): void {
    this.submitted = false;
    this.form = this.emptyForm();
    this.showAdd = true;
  }

  /* ================= VIEW ================= */

  viewPackage(item: any): void {
    this.selectedPackage = item;
    this.showView = true;
  }

  /* ================= EDIT ================= */

  editPackage(item: any): void {
    this.submitted = false;

    this.form = {
      id: item.id,
      package_id: item.package_id,
      room_name: item.room_name,
      room_product_id: (item.room_products || []).map((p: any) => p.id),
      switchboards: (item.switchboards || []).map((sb: any) => ({
        switchboard_name: sb.switchboard_name,
        panel_mod: sb.panel_mod,
        switch_board_product_id: (sb.products || []).map((p: any) => p.id),
        _dropdownOpen: false,
        _search: ''
      }))
    };

    this.showEdit = true;
  }

  /* ================= SAVE ================= */

  savePackage(): void {
    this.submitted = true;

    if (!this.validateForm()) {
      return;
    }

    // payload matches the API contract exactly - strip UI-only fields
    const payload = {
      package_id: this.form.package_id,
      room_name: this.form.room_name,
      room_products: this.form.room_product_id,
      switchboards: this.form.switchboards.map(sb => ({
        switchboard_name: sb.switchboard_name,
        panel_mod: sb.panel_mod,
        switch_board_product_id: sb.switch_board_product_id
      }))
    };

    this.loader.show();

    if (this.showAdd) {
      this.admin.createRoomPackage(payload).subscribe({
        next: () => {
          this.toast.show('Package created successfully.', 'success');
          this.loader.hide();
          this.close();
          this.loadPackages();
        },
        error: (err: any) => {
          this.toast.show(err?.error?.message || 'Unable to create package.', 'error');
          this.loader.hide();
        }
      });
    } else {
      // form.id is guaranteed here because showEdit is only true
      // after editPackage() has populated it.
      this.admin.updateRoomPackage(this.form.id as number, payload).subscribe({
        next: () => {
          this.toast.show('Package updated successfully.', 'success');
          this.loader.hide();
          this.close();
          this.loadPackages();
        },
        error: (err: any) => {
          this.toast.show(err?.error?.message || 'Unable to update package.', 'error');
          this.loader.hide();
        }
      });
    }
  }

  validateForm(): boolean {
    if (!this.form.package_id) {
      return false;
    }

    if (!this.form.room_name?.trim()) {
      return false;
    }

    for (const sb of this.form.switchboards) {
      if (!sb.switchboard_name?.trim()) {
        return false;
      }
      if (sb.panel_mod === null || sb.panel_mod === undefined) {
        return false;
      }
    }

    return true;
  }

  /* ================= HELPERS ================= */

  close(): void {
    this.showAdd = false;
    this.showEdit = false;
    this.showView = false;
    this.selectedPackage = null;
    this.submitted = false;
  }

  refresh(): void {
    this.searchText = '';
    this.loadPackages();
  }

  private emptyForm(): PackageForm {
    return {
      id: null,
      package_id: null,
      room_name: '',
      room_product_id: [],
      switchboards: []
    };
  }

  previewImage: string | null = null;

  openImagePreview(img: string): void {
    this.previewImage = img;
  }

  closeImagePreview(): void {
    this.previewImage = null;
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/no-image.png';
  }

  /* ================= SWITCHBOARD ROWS ================= */

  addSwitchboard(): void {
    this.form.switchboards.push({
      switchboard_name: '',
      panel_mod: null,
      switch_board_product_id: [],
      _dropdownOpen: false,
      _search: ''
    });
  }

  removeSwitchboard(index: number): void {
    this.form.switchboards.splice(index, 1);
  }

  toggleSwitchboardDropdown(index: number): void {
    const wasOpen = !!this.form.switchboards[index]._dropdownOpen;

    // Only one dropdown open at a time (room dropdown + all switchboard dropdowns)
    this.roomDropdownOpen = false;
    this.form.switchboards.forEach((sb, i) => {
      sb._dropdownOpen = i === index ? !wasOpen : false;
    });

    if (!wasOpen) {
      this.form.switchboards[index]._search = '';
    }
  }

  closeDropdowns(): void {
    this.roomDropdownOpen = false;
    this.form.switchboards.forEach(sb => sb._dropdownOpen = false);
  }

  filteredSwitchProducts(index: number): any[] {
    const search = (this.form.switchboards[index]._search || '').toLowerCase().trim();

    if (!search) {
      return this.switchBoardProductOptions;
    }

    return this.switchBoardProductOptions.filter((p: any) =>
      p.product_name.toLowerCase().includes(search)
    );
  }

  selectedSwitchProducts(index: number): any[] {
    const ids = this.form.switchboards[index].switch_board_product_id;
    return this.productList.filter((p: any) =>
      p.category === 'NUOS Products' && ids.includes(p.id)
    );
  }

  toggleSwitchProductSelection(index: number, productId: number): void {
    const sb = this.form.switchboards[index];
    const product = this.productList.find((p: any) => p.id === productId);

    if (!product) {
      return;
    }

    const alreadySelected = this.isSelected(productId, sb.switch_board_product_id);

    // Removing a product is always allowed
    if (alreadySelected) {
      this.toggleSelection(productId, sb.switch_board_product_id);
      return;
    }

    if (sb.panel_mod === null || sb.panel_mod === undefined) {
      this.toast.show('Please select a Panel Mod before adding products.', 'error');
      return;
    }

    if (!this.canSelectProduct(index, product)) {
      this.toast.show(
        `Panel Mod ${sb.panel_mod} has a capacity of ${sb.panel_mod} mod. Only ${this.getRemainingModSize(index)} mod remaining, this product needs ${product.mod_size}.`,
        'error'
      );
      return;
    }

    this.toggleSelection(productId, sb.switch_board_product_id);
  }

  /**
   * Capacity rule: total mod_size of selected products for a switchboard
   * cannot exceed its panel_mod.
   * panel_mod 2 -> 1 product (mod_size 2), 4 -> 2 products, 8 -> 4 products ...
   */
  getUsedModSize(index: number): number {
    return this.selectedSwitchProducts(index)
      .reduce((sum: number, p: any) => sum + (p.mod_size || 0), 0);
  }

  getRemainingModSize(index: number): number {
    const sb = this.form.switchboards[index];

    if (sb.panel_mod === null || sb.panel_mod === undefined) {
      return 0;
    }

    return sb.panel_mod - this.getUsedModSize(index);
  }

  getMaxProductCount(index: number): number {
    const sb = this.form.switchboards[index];

    if (sb.panel_mod === null || sb.panel_mod === undefined) {
      return 0;
    }

    // Assumes standard mod_size of 2 per product, matching panel_mod / 2
    return Math.floor(sb.panel_mod / 2);
  }

  canSelectProduct(index: number, product: any): boolean {
    const sb = this.form.switchboards[index];

    if (sb.panel_mod === null || sb.panel_mod === undefined) {
      return false;
    }

    if (this.isSelected(product.id, sb.switch_board_product_id)) {
      return true;
    }

    return this.getRemainingModSize(index) >= (product.mod_size || 0);
  }

  isProductDisabled(index: number, product: any): boolean {
    const sb = this.form.switchboards[index];

    if (sb.panel_mod === null || sb.panel_mod === undefined) {
      return true;
    }

    if (this.isSelected(product.id, sb.switch_board_product_id)) {
      return false;
    }

    return this.getRemainingModSize(index) < (product.mod_size || 0);
  }

  /**
   * When panel_mod changes, drop already-selected products that no
   * longer fit the new (smaller) capacity, keeping earlier selections first.
   */
  onPanelModChange(index: number): void {
    const sb = this.form.switchboards[index];

    if (sb.panel_mod === null || sb.panel_mod === undefined) {
      if (sb.switch_board_product_id.length) {
        sb.switch_board_product_id = [];
      }
      return;
    }

    let used = 0;
    const kept: number[] = [];

    for (const id of sb.switch_board_product_id) {
      const product = this.productList.find((p: any) => p.id === id);
      const modSize = product?.mod_size || 0;

      if (used + modSize <= sb.panel_mod) {
        kept.push(id);
        used += modSize;
      }
    }

    if (kept.length !== sb.switch_board_product_id.length) {
      this.toast.show(
        'Some selected products were removed because they no longer fit the new Panel Mod.',
        'error'
      );
    }

    sb.switch_board_product_id = kept;
  }

  /* ================= ROOM PRODUCTS (Non-NUOS) DROPDOWN ================= */

  toggleRoomDropdown(): void {
    const wasOpen = this.roomDropdownOpen;

    this.form.switchboards.forEach(sb => sb._dropdownOpen = false);
    this.roomDropdownOpen = !wasOpen;

    if (!wasOpen) {
      this.roomSearch = '';
    }
  }

  get filteredRoomProducts() {
    if (!this.roomSearch) {
      return this.roomProductOptions;
    }

    return this.roomProductOptions.filter((product: any) =>
      product.product_name.toLowerCase().includes(this.roomSearch.toLowerCase())
    );
  }

  get selectedRoomProducts(): any[] {
    return this.productList.filter((p: any) =>
      p.category === 'Non-NUOS Products' && this.form.room_product_id.includes(p.id)
    );
  }

  /* ================= SELECTION ================= */

  isSelected(id: number, selectedIds: number[]): boolean {
    return selectedIds.includes(id);
  }

  toggleSelection(id: number, selectedIds: number[]): void {
    const index = selectedIds.indexOf(id);

    if (index > -1) {
      selectedIds.splice(index, 1);
    } else {
      selectedIds.push(id);
    }
  }

  /* ================= PRODUCT OPTIONS (filtered by category) ================= */

  get switchBoardProductOptions(): any[] {
    return this.productList.filter((p: any) => p.category === 'NUOS Products');
  }

  get roomProductOptions(): any[] {
    return this.productList.filter((p: any) => p.category === 'Non-NUOS Products');
  }

  getWiringName(id: number): string {
    const wiring = this.wiringTypes.find((w: any) => w.id === id);
    return wiring ? wiring.wiring_name : '-';
  }

  /* ================= DELETE ================= */

  openConfirm(id: number): void {
    this.confirmPackageId = id;
    this.confirmMessage = 'Are you sure you want to delete this package?';
    this.showConfirm = true;
  }

  confirmNo(): void {
    this.resetConfirm();
  }

  confirmYes(): void {
    if (!this.confirmPackageId) {
      return;
    }

    const id = this.confirmPackageId;
    this.resetConfirm();
    this.loader.show();

    this.admin.deleteRoomPackage(id).subscribe({
      next: () => {
        this.toast.show('Package deleted successfully.', 'success');
        this.loader.hide();
        this.loadPackages();
      },
      error: (err: any) => {
        this.toast.show(err?.error?.message || 'Unable to delete package.', 'error');
        this.loader.hide();
      }
    });
  }

  resetConfirm(): void {
    this.showConfirm = false;
    this.confirmPackageId = null;
    this.confirmMessage = '';
  }
}