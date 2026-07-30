import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminService } from '../../core/services/admin.service';
import { LoaderService } from '../../core/services/loader.service';
import { ToastService } from '../../core/services/toast.service';

interface PackageForm {
  id: number | null;
  package_id: number | null;
  room_name: string;
  panel_mod: number | null;
  switch_board_product_id: number[];
  room_product_id: number[];
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

  switchDropdownOpen = false;
  roomDropdownOpen = false;

  searchText: string = '';

  packageList: any[] = [];
  productList: any[] = [];
  panelModOptions: number[] = [2, 4, 6, 8, 10, 12];
  switchSearch = '';
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
      panel_mod: item.panel_mod,
      switch_board_product_id:
        (item.switch_board_products || []).map((x: any) => x.id),
      room_product_id:
        (item.room_products || []).map((x: any) => x.id)
    };

    this.showEdit = true;

    // Preselect multi-select options once the modal has rendered
    setTimeout(() => {

      const switchSelect =
        document.getElementById('switchBoardSelect') as HTMLSelectElement | null;

      const roomSelect =
        document.getElementById('roomProductSelect') as HTMLSelectElement | null;

      if (switchSelect) {
        Array.from(switchSelect.options).forEach((o) => {
          o.selected = this.form.switch_board_product_id.includes(Number(o.value));
        });
      }

      if (roomSelect) {
        Array.from(roomSelect.options).forEach((o) => {
          o.selected = this.form.room_product_id.includes(Number(o.value));
        });
      }

    });

  }

  onSwitchBoardChange(event: any): void {
    this.form.switch_board_product_id = Array
      .from(event.target.selectedOptions)
      .map((x: any) => Number(x.value));
  }

  onRoomProductChange(event: any): void {
    this.form.room_product_id = Array
      .from(event.target.selectedOptions)
      .map((x: any) => Number(x.value));
  }

  /* ================= SAVE ================= */

  savePackage(): void {

    this.submitted = true;

    if (!this.validateForm()) {
      return;
    }

    const payload = {
      package_id: this.form.package_id,
      room_name: this.form.room_name,
      panel_mod: this.form.panel_mod,
      created_by: 1,
      switch_board_product_id: this.form.switch_board_product_id,
      room_product_id: this.form.room_product_id
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
          this.toast.show(
            err?.error?.message || 'Unable to create package.',
            'error'
          );
          this.loader.hide();
        }
      });

    } else {

      // form.id is guaranteed to be set here because showEdit
      // is only true after editPackage() has populated it.
      this.admin.updateRoomPackage(
        this.form.id as number,
        payload
      ).subscribe({
        next: () => {
          this.toast.show('Package updated successfully.', 'success');
          this.loader.hide();
          this.close();
          this.loadPackages();
        },
        error: (err: any) => {
          this.toast.show(
            err?.error?.message || 'Unable to update package.',
            'error'
          );
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

    if (this.form.panel_mod === null || this.form.panel_mod === undefined) {
      return false;
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
      panel_mod: null,
      switch_board_product_id: [],
      room_product_id: []
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
    console.log('Image failed to load:', event.target.src);

    // Optional fallback image
    event.target.src = 'assets/images/no-image.png';
  }

  /* ================= DROPDOWN CONTROL ================= */

 toggleSwitchDropdown() {

    this.switchDropdownOpen = !this.switchDropdownOpen;

    if (this.switchDropdownOpen) {

        this.roomDropdownOpen = false;

        this.switchSearch = '';

    }

}

  toggleRoomDropdown() {

    this.roomDropdownOpen = !this.roomDropdownOpen;

    if (this.roomDropdownOpen) {

        this.switchDropdownOpen = false;

        this.roomSearch = '';

    }

}

  closeDropdowns(): void {
    this.switchDropdownOpen = false;
    this.roomDropdownOpen = false;
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

  /* ================= SELECTED PRODUCT LOOKUPS ================= */

/* ================= DROPDOWN OPTIONS (filtered by category) ================= */

  get switchBoardProductOptions(): any[] {
    return this.productList.filter((p: any) =>
      p.category === 'NUOS Products'
    );
  }

  get roomProductOptions(): any[] {
    return this.productList.filter((p: any) =>
      p.category === 'Non-NUOS Products'
    );
  }

  /* ================= SELECTED PRODUCT LOOKUPS ================= */

  get selectedSwitchProducts(): any[] {
    return this.productList.filter((p: any) =>
      p.category === 'NUOS Products' &&
      this.form.switch_board_product_id.includes(p.id)
    );
  }

  get selectedRoomProducts(): any[] {
    return this.productList.filter((p: any) =>
      p.category === 'Non-NUOS Products' &&
      this.form.room_product_id.includes(p.id)
    );
  }

  getWiringName(id: number): string {
    const wiring = this.wiringTypes.find((w: any) => w.id === id);
    return wiring ? wiring.wiring_name : '-';
  }

 get filteredSwitchBoardProducts() {

    if (!this.switchSearch) {

        return this.switchBoardProductOptions;

    }

    return this.switchBoardProductOptions.filter((product: any) =>

        product.product_name
            .toLowerCase()
            .includes(this.switchSearch.toLowerCase())

    );

}

get filteredRoomProducts() {

    if (!this.roomSearch) {

        return this.roomProductOptions;

    }

    return this.roomProductOptions.filter((product: any) =>

        product.product_name
            .toLowerCase()
            .includes(this.roomSearch.toLowerCase())

    );

}

deletePackage(item: any): void {

  const confirmed = confirm(
    `Are you sure you want to delete "${item.room_name}"?`
  );

  if (!confirmed) {
    return;
  }

  // this.isLoading = true;

  this.admin.deleteRoomPackage(item.id).subscribe({

    next: (res: any) => {

      // this.isLoading = false;

      alert(res.message || 'Package deleted successfully.');

      // Reload package list
      this.loadPackages();

    },

    error: (err) => {

      // this.isLoading = false;

      console.error(err);

      alert(
        err?.error?.message || 'Something went wrong.'
      );

    }

  });

  

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
        this.toast.show(
          err?.error?.message || 'Unable to delete package.',
          'error'
        );
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