import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { LoaderService } from '../../../core/services/loader.service';
import { ToastService } from '../../../core/services/toast.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';

/** Fixed ARGB tint used for auto-filled switchboards — no color-picker UI exists yet. */
const DEFAULT_COLOR_VALUE = 4279384405;

interface ProposalProductEntry {
  id: number | null;
  firstLoad: string;
  secondLoad: string;
  thirdLoad: string;
  forthLoad: string;
  new_price: number | null;
}

interface ProposalSwitchboardForm {
  name: string;
  mod: number | null;
  colorValue: number;
  products: ProposalProductEntry[];
}

interface ProposalRoomForm {
  name: string;
  pkgId: number | null;
  products: ProposalProductEntry[];
  switchboards: ProposalSwitchboardForm[];
}

interface ProposalHomeForm {
  name: string;
  rooms: ProposalRoomForm[];
}

interface ProposalFloorForm {
  name: string;
  homes: ProposalHomeForm[];
}

interface ProductWiseItemForm {
  id: number | null;
  quantity: number;
  new_price: number | null;
}

interface ProposalForm {
  id: number | null;
  client_id: number | null;
  proposal_title: string;
  proposal_type: 'structureWise' | 'productsWise';
  commissioning_percentage: number;
  discount_percentage: number;
  installation_percentage: number;
  recipient_name: string | null;
  ship_to_address: string | null;
  use_same_address: boolean;
  use_same_recipient: boolean;
  floor: ProposalFloorForm[];
  products_wise_items: ProductWiseItemForm[];
}

@Component({
  selector: 'app-proposal',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, InputTextModule, DialogModule, SelectModule, ToggleSwitchModule, TooltipModule, DatePickerModule],
  templateUrl: './proposal.component.html',
  styleUrls: ['./proposal.component.scss']
})
export class ProposalComponent implements OnInit {

  proposals: any[] = [];
  selectedProposal: any = null;
  searchText: string = '';
  proposalDateRange: Date[] | null = null;
  filteredProposals: any[] = [];

  // 🔥 STATUS OPTIONS
  statusOptions: string[] = ['Pending', 'Completed', 'Rejected'];

  // 🔥 STATUS CONFIRMATION MODAL STATE
  showStatusConfirm: boolean = false;
  statusToConfirm: string = '';

  /* ================= ADD / EDIT PROPOSAL ================= */
  clients: any[] = [];
  roomPackages: any[] = [];
  productList: any[] = [];

  proposalTypeOptions = [
    { label: 'Structure Wise', value: 'structureWise' },
    { label: 'Products Wise', value: 'productsWise' }
  ];

  showAddEditProposal = false;
  proposalSubmitted = false;
  proposalForm: ProposalForm = this.emptyProposalForm();

  showDeleteConfirm = false;
  confirmDeleteId: number | null = null;

  get clientSelectOptions() {
    return this.clients.map((c: any) => ({
      id: c.id,
      label: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email_id || `Client #${c.id}`
    }));
  }

  /** Full client record for the selected client_id — used to display their address once picked. */
  get selectedClient(): any {
    return this.clients.find((c: any) => c.id === this.proposalForm.client_id) || null;
  }

  get productWiseSelectOptions() {
    return this.productList.map((p: any) => ({
      id: p.id,
      label: `${p.product_name} (${p.category})`,
      image: p.image_urls?.[0] || null
    }));
  }

  get roomPackageSelectOptions() {
    return this.roomPackages.map((p: any) => ({
      id: p.id,
      label: `${p.room_name} — ${p.package_name}`
    }));
  }

  /** Room-level products are Non-NUOS; switchboard products are NUOS — same convention as the Packages module. */
  get roomProductSelectOptions() {
    return this.productList
      .filter((p: any) => (p.category || '').toLowerCase() === 'non-nuos products')
      .map((p: any) => ({ id: p.id, label: p.product_name, image: p.image_urls?.[0] || null }));
  }

  get switchboardProductSelectOptions() {
    return this.productList
      .filter((p: any) => (p.category || '').toLowerCase() === 'nuos products')
      .map((p: any) => ({ id: p.id, label: p.product_name, image: p.image_urls?.[0] || null }));
  }

  panelModOptions: number[] = [2, 4, 6, 8, 10, 12];

  get financialPreview() {
    return this.computeFinancials();
  }

  constructor(
    private adminService: AdminService,
    private loader: LoaderService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.loadProposals();
    this.loadProposalDropdowns();
  }

  loadProposalDropdowns(): void {
    this.adminService.getClient().subscribe({
      next: (res: any) => { this.clients = res.data || []; },
      error: () => this.toast.show('Unable to load client list.', 'error')
    });

    this.adminService.getRoomPackages().subscribe({
      next: (res: any) => { this.roomPackages = res.data || []; },
      error: () => this.toast.show('Unable to load room packages.', 'error')
    });

    // getActiveProduct (not getProductName) — it's the only endpoint that returns both
    // is_price_editable and image_urls, both needed by the builder below.
    this.adminService.getActiveProduct().subscribe({
      next: (res: any) => { this.productList = res.resp?.data || []; },
      error: () => this.toast.show('Unable to load product list.', 'error')
    });
  }

  private emptyProposalForm(): ProposalForm {
    return {
      id: null,
      client_id: null,
      proposal_title: '',
      proposal_type: 'structureWise',
      commissioning_percentage: 0,
      discount_percentage: 0,
      installation_percentage: 0,
      recipient_name: null,
      ship_to_address: null,
      use_same_address: false,
      use_same_recipient: false,
      floor: [],
      products_wise_items: []
    };
  }

  private mapProductEntry(p: any): ProposalProductEntry {
    return {
      id: p.id,
      firstLoad: p.firstLoad || '',
      secondLoad: p.secondLoad || '',
      thirdLoad: p.thirdLoad || '',
      forthLoad: p.forthLoad || '',
      new_price: p.new_price ?? null
    };
  }

  openAddProposal(): void {
    this.proposalSubmitted = false;
    this.proposalForm = this.emptyProposalForm();
    this.showAddEditProposal = true;
  }

  editProposal(item: any): void {
    this.proposalSubmitted = false;

    const floor: ProposalFloorForm[] = this.toArray(item.floor).map((f: any) => ({
      name: f.name,
      homes: this.toArray(f.homes).map((h: any) => ({
        name: h.name,
        rooms: this.toArray(h.rooms).map((r: any) => ({
          name: r.name,
          pkgId: r.pkgId ?? null,
          products: this.toArray(r.products).map((p: any) => this.mapProductEntry(p)),
          switchboards: this.toArray(r.switchboards).map((sb: any) => ({
            name: sb.name,
            mod: sb.mod ?? null,
            colorValue: sb.colorValue ?? DEFAULT_COLOR_VALUE,
            products: this.toArray(sb.products).map((p: any) => this.mapProductEntry(p))
          }))
        }))
      }))
    }));

    const products_wise_items: ProductWiseItemForm[] = this.toArray(item.products_wise_items).map((p: any) => ({
      id: p.id,
      quantity: p.quantity ?? 1,
      new_price: p.new_price ?? null
    }));

    this.proposalForm = {
      id: item.proposal_id ?? item.id,
      client_id: item.client_details?.id ?? item.client_id ?? null,
      proposal_title: item.proposal_title || '',
      proposal_type: item.proposal_type,
      commissioning_percentage: item.commissioning_percentage ?? 0,
      discount_percentage: item.discount_percentage ?? 0,
      installation_percentage: item.installation_percentage ?? 0,
      recipient_name: item.recipient_name ?? null,
      ship_to_address: item.ship_to_address ?? null,
      use_same_address: item.use_same_address ?? false,
      use_same_recipient: item.use_same_recipient ?? false,
      floor,
      products_wise_items
    };

    this.showAddEditProposal = true;
  }

  closeProposalForm(): void {
    this.showAddEditProposal = false;
    this.proposalSubmitted = false;
  }

  /* ---------- structure builder: floor / home / room / switchboard ---------- */

  addFloor(): void {
    this.proposalForm.floor.push({ name: `Floor ${this.proposalForm.floor.length + 1}`, homes: [] });
  }

  removeFloor(floorIndex: number): void {
    this.proposalForm.floor.splice(floorIndex, 1);
  }

  addHome(floorIndex: number): void {
    const floor = this.proposalForm.floor[floorIndex];
    floor.homes.push({ name: `Home ${floor.homes.length + 1}`, rooms: [] });
  }

  removeHome(floorIndex: number, homeIndex: number): void {
    this.proposalForm.floor[floorIndex].homes.splice(homeIndex, 1);
  }

  addRoom(floorIndex: number, homeIndex: number): void {
    this.proposalForm.floor[floorIndex].homes[homeIndex].rooms.push({
      name: '',
      pkgId: null,
      products: [],
      switchboards: []
    });
  }

  removeRoom(floorIndex: number, homeIndex: number, roomIndex: number): void {
    this.proposalForm.floor[floorIndex].homes[homeIndex].rooms.splice(roomIndex, 1);
  }

  /** Selecting a saved Room Package auto-fills the room's products and switchboards. */
  onRoomPackageChange(floorIndex: number, homeIndex: number, roomIndex: number): void {
    const room = this.proposalForm.floor[floorIndex].homes[homeIndex].rooms[roomIndex];
    const pkg = this.roomPackages.find((p: any) => p.id === room.pkgId);

    if (!pkg) {
      room.products = [];
      room.switchboards = [];
      return;
    }

    if (!room.name?.trim()) {
      room.name = pkg.room_name;
    }

    room.products = (pkg.room_products || []).map((p: any) => this.mapProductEntry({ id: p.id }));
    room.switchboards = (pkg.switchboards || []).map((sb: any) => ({
      name: sb.switchboard_name,
      mod: sb.panel_mod,
      colorValue: DEFAULT_COLOR_VALUE,
      products: (sb.products || []).map((p: any) => this.mapProductEntry({ id: p.id }))
    }));
  }

  private emptyProductEntry(): ProposalProductEntry {
    return { id: null, firstLoad: '', secondLoad: '', thirdLoad: '', forthLoad: '', new_price: null };
  }

  /** Package selection is optional — this lets the admin add room-level products by hand instead. */
  addRoomProduct(floorIndex: number, homeIndex: number, roomIndex: number): void {
    this.proposalForm.floor[floorIndex].homes[homeIndex].rooms[roomIndex].products.push(this.emptyProductEntry());
  }

  removeRoomProduct(floorIndex: number, homeIndex: number, roomIndex: number, productIndex: number): void {
    this.proposalForm.floor[floorIndex].homes[homeIndex].rooms[roomIndex].products.splice(productIndex, 1);
  }

  /** Package selection is optional — this lets the admin build switchboards from scratch instead. */
  addSwitchboard(floorIndex: number, homeIndex: number, roomIndex: number): void {
    this.proposalForm.floor[floorIndex].homes[homeIndex].rooms[roomIndex].switchboards.push({
      name: '',
      mod: null,
      colorValue: DEFAULT_COLOR_VALUE,
      products: []
    });
  }

  removeSwitchboard(floorIndex: number, homeIndex: number, roomIndex: number, sbIndex: number): void {
    this.proposalForm.floor[floorIndex].homes[homeIndex].rooms[roomIndex].switchboards.splice(sbIndex, 1);
  }

  /** Panel mod capacity: mod 2 → 1 product, mod 4 → 2, mod 8 → 4, i.e. one product per 2 mod. */
  maxSwitchboardProducts(mod: number | null): number {
    return mod ? Math.floor(mod / 2) : 0;
  }

  addSwitchboardProduct(floorIndex: number, homeIndex: number, roomIndex: number, sbIndex: number): void {
    const sb = this.proposalForm.floor[floorIndex].homes[homeIndex].rooms[roomIndex].switchboards[sbIndex];
    const max = this.maxSwitchboardProducts(sb.mod);

    if (!sb.mod) {
      this.toast.show('Select a Panel Mod before adding products.', 'error');
      return;
    }

    if (sb.products.length >= max) {
      this.toast.show(`Panel Mod ${sb.mod} supports up to ${max} product${max === 1 ? '' : 's'}.`, 'error');
      return;
    }

    sb.products.push(this.emptyProductEntry());
  }

  /** When mod shrinks, trim any products that no longer fit the new capacity. */
  onSwitchboardModChange(floorIndex: number, homeIndex: number, roomIndex: number, sbIndex: number): void {
    const sb = this.proposalForm.floor[floorIndex].homes[homeIndex].rooms[roomIndex].switchboards[sbIndex];
    const max = this.maxSwitchboardProducts(sb.mod);

    if (sb.products.length > max) {
      sb.products = sb.products.slice(0, max);
      this.toast.show('Some products were removed because they no longer fit the new Panel Mod.', 'error');
    }
  }

  removeSwitchboardProduct(floorIndex: number, homeIndex: number, roomIndex: number, sbIndex: number, productIndex: number): void {
    this.proposalForm.floor[floorIndex].homes[homeIndex].rooms[roomIndex].switchboards[sbIndex].products.splice(productIndex, 1);
  }

  /* ---------- productsWise line items ---------- */

  addProductWiseItem(): void {
    this.proposalForm.products_wise_items.push({ id: null, quantity: 1, new_price: null });
  }

  removeProductWiseItem(index: number): void {
    this.proposalForm.products_wise_items.splice(index, 1);
  }

  /* ---------- product lookups ---------- */

  private getProductBase(id: number | null): any {
    if (!id) return null;
    return this.productList.find((p: any) => p.id === id) || null;
  }

  getProductName(id: number | null): string {
    return this.getProductBase(id)?.product_name || (id ? `Product #${id}` : '-');
  }

  getProductImage(id: number | null): string | null {
    return this.getProductBase(id)?.image_urls?.[0] || null;
  }

  /** Full product record (category, price, wiring type, mod size, zigbee type, etc.) for detail display. */
  getProductInfo(id: number | null): any {
    return this.getProductBase(id);
  }

  isPriceEditable(id: number | null): boolean {
    return !!this.getProductBase(id)?.is_price_editable;
  }

  private effectivePrice(id: number | null, overridePrice: number | null | undefined): number {
    if (overridePrice !== null && overridePrice !== undefined) {
      return Number(overridePrice);
    }
    return Number(this.getProductBase(id)?.price || 0);
  }

  /* ---------- financial calculation ---------- */

  private collectAllStructureProducts(): { price: number; category: string }[] {
    const out: { price: number; category: string }[] = [];

    for (const floor of this.proposalForm.floor) {
      for (const home of floor.homes) {
        for (const room of home.rooms) {
          for (const p of room.products) {
            out.push({ price: this.effectivePrice(p.id, p.new_price), category: this.getProductBase(p.id)?.category });
          }
          for (const sb of room.switchboards) {
            for (const p of sb.products) {
              out.push({ price: this.effectivePrice(p.id, p.new_price), category: this.getProductBase(p.id)?.category });
            }
          }
        }
      }
    }

    return out;
  }

  computeFinancials() {
    let grandProductsTotal = 0;
    let nonNuosProductsTotal = 0;

    if (this.proposalForm.proposal_type === 'productsWise') {
      for (const item of this.proposalForm.products_wise_items) {
        if (!item.id) continue;

        const base = this.getProductBase(item.id);
        const price = this.effectivePrice(item.id, item.new_price);
        const qty = Number(item.quantity) || 0;
        const lineTotal = price * qty;

        grandProductsTotal += lineTotal;

        if ((base?.category || '').toLowerCase() === 'non-nuos products') {
          nonNuosProductsTotal += lineTotal;
        }
      }
    } else {
      for (const entry of this.collectAllStructureProducts()) {
        grandProductsTotal += entry.price;

        if ((entry.category || '').toLowerCase() === 'non-nuos products') {
          nonNuosProductsTotal += entry.price;
        }
      }
    }

    const discountAmount = grandProductsTotal * (Number(this.proposalForm.discount_percentage) || 0) / 100;
    const afterDiscount = grandProductsTotal - discountAmount;
    const installationAmount = afterDiscount * (Number(this.proposalForm.installation_percentage) || 0) / 100;
    const commissioningAmount = afterDiscount * (Number(this.proposalForm.commissioning_percentage) || 0) / 100;
    const finalTotal = afterDiscount + installationAmount + commissioningAmount;

    return {
      grandProductsTotal: Math.round(grandProductsTotal),
      discountAmount: Math.round(discountAmount),
      afterDiscount: Math.round(afterDiscount),
      installationAmount: Math.round(installationAmount),
      commissioningAmount: Math.round(commissioningAmount),
      nonNuosProductsTotal: Math.round(nonNuosProductsTotal),
      finalTotal: Math.round(finalTotal)
    };
  }

  /* ---------- validate + save ---------- */

  validateProposalForm(): boolean {
    this.proposalSubmitted = true;

    if (!this.proposalForm.client_id) return false;
    if (!this.proposalForm.proposal_type) return false;

    if (this.proposalForm.proposal_type === 'productsWise') {
      if (!this.proposalForm.products_wise_items.length) return false;
      if (this.proposalForm.products_wise_items.some(i => !i.id || !i.quantity || i.quantity < 1)) return false;
    } else {
      if (!this.proposalForm.floor.length) return false;
    }

    return true;
  }

  saveProposal(): void {
    if (!this.validateProposalForm()) {
      return;
    }

    const financial_breakdown = this.computeFinancials();
    const isEdit = !!this.proposalForm.id;

    const payload: any = {
      client_id: this.proposalForm.client_id,
      proposal_title: this.proposalForm.proposal_title,
      proposal_type: this.proposalForm.proposal_type,
      commissioning_percentage: this.proposalForm.commissioning_percentage,
      discount_percentage: this.proposalForm.discount_percentage,
      installation_percentage: this.proposalForm.installation_percentage,
      recipient_name: this.proposalForm.use_same_recipient ? null : this.proposalForm.recipient_name,
      ship_to_address: this.proposalForm.use_same_address ? null : this.proposalForm.ship_to_address,
      use_same_address: this.proposalForm.use_same_address,
      use_same_recipient: this.proposalForm.use_same_recipient,
      financial_breakdown,
      grand_total: financial_breakdown.finalTotal
    };

    if (this.proposalForm.proposal_type === 'structureWise') {
      payload.floor = this.proposalForm.floor;
    } else {
      payload.products_wise_items = this.proposalForm.products_wise_items.map(i => ({
        id: i.id,
        quantity: i.quantity,
        ...(i.new_price !== null && i.new_price !== undefined ? { new_price: i.new_price } : {})
      }));
    }

    this.loader.show();

    const request$ = isEdit
      ? this.adminService.updateProposal(this.proposalForm.id as number, payload)
      : this.adminService.insertProposal(payload);

    request$.subscribe({
      next: () => {
        this.toast.show(`Proposal ${isEdit ? 'updated' : 'created'} successfully`, 'success');
        this.loader.hide();
        this.closeProposalForm();
        this.loadProposals();
      },
      error: (err: any) => {
        this.toast.show(err?.error?.message || `Failed to ${isEdit ? 'update' : 'create'} proposal`, 'error');
        this.loader.hide();
      }
    });
  }

  /* ---------- delete ---------- */

  openDeleteConfirm(item: any): void {
    this.confirmDeleteId = item.proposal_id ?? item.id;
    this.showDeleteConfirm = true;
  }

  cancelDeleteProposal(): void {
    this.showDeleteConfirm = false;
    this.confirmDeleteId = null;
  }

  confirmDeleteProposal(): void {
    if (!this.confirmDeleteId) return;

    const id = this.confirmDeleteId;
    this.showDeleteConfirm = false;
    this.confirmDeleteId = null;
    this.loader.show();

    this.adminService.deleteProposal(id).subscribe({
      next: () => {
        this.toast.show('Proposal deleted successfully', 'success');
        this.loader.hide();
        this.loadProposals();
      },
      error: (err: any) => {
        this.toast.show(err?.error?.message || 'Failed to delete proposal', 'error');
        this.loader.hide();
      }
    });
  }

  /* ================= LOAD LIST ================= */
  loadProposals() {
    setTimeout(() => this.loader.show());

    this.adminService.getProposals().subscribe({
      next: (res: any) => {
        this.proposals = this.toArray(res?.data?.data);
        this.filteredProposals = [...this.proposals];
        setTimeout(() => this.loader.hide());
      },
      error: () => {
        setTimeout(() => this.loader.hide());
        this.toast.show('Failed to load proposals', 'error');
      }
    });
  }

  viewProposal(proposal: any) {

    this.selectedProposal = {
      ...proposal,
      proposal_status: proposal.proposal_status || null
    };

  }

  backToList() {
    this.selectedProposal = null;
  }

  /* ================= SAFE ARRAY HELPERS ================= */

  getFloors() {
    return this.toArray(this.selectedProposal?.floor);
  }

  getHomes(floor: any) {
    return this.toArray(floor?.homes);
  }

  getRooms(home: any) {
    return this.toArray(home?.rooms);
  }

  getSwitchboards(room: any) {
    return this.toArray(room?.switchboards);
  }

  getProducts(sb: any) {
    return this.toArray(sb?.products);
  }

  private toArray<T>(value: T | T[] | null | undefined): T[] {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return [value];
    return [];
  }

  /* ================= CATEGORY / IMAGE HELPER ================= */

  isOriginalImage(category: string): boolean {
    return (category || '').trim().toLowerCase() === 'non-nuos products';
  }

  /* ================= STATUS ================= */

  getStatusClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'completed':
        return 'status-completed';
      case 'rejected':
        return 'status-rejected';
      default:
        return '';
    }
  }

  /**
   * 🔥 Fired the moment the user picks a new value in the dropdown.
   * Nothing is applied yet — just opens the confirmation modal.
   * Because the <select> uses one-way [ngModel] (not [(ngModel)]),
   * the displayed value automatically reverts if the change is cancelled.
   */
  previousStatus = '';
  // statusToConfirm = '';

  onStatusChange(newStatus: string) {

    if (!this.selectedProposal) {
      return;
    }

    if (newStatus === this.selectedProposal.proposal_status) {
      return;
    }

    this.previousStatus = this.selectedProposal.proposal_status;
    this.statusToConfirm = newStatus;
    this.showStatusConfirm = true;

  }
  /**
   * 🔥 "No" button — discard the pending change.
   */
  cancelStatusChange() {
    this.showStatusConfirm = false;
    this.statusToConfirm = '';
  }

  /**
   * 🔥 "Yes" / "Yes, Send Mail" buttons.
   */
  confirmStatusChange(sendMail: boolean) {

    this.showStatusConfirm = false;

    this.updateStatus(this.statusToConfirm, sendMail);

    this.statusToConfirm = '';

  }

  updateStatus(newStatus: string, sendMail: boolean = false): void {

    if (!this.selectedProposal) {
      return;
    }

    const id = this.selectedProposal.proposal_id || this.selectedProposal.id;

    const reqBody = {
      proposal_status: newStatus,
      send_email: sendMail
    };

    this.loader.show();

    this.adminService.updateProposalStatus(id, reqBody).subscribe({

      next: (res: any) => {

        this.selectedProposal.proposal_status = newStatus;

        const proposal = this.proposals.find(
          p => (p.proposal_id || p.id) === id
        );

        if (proposal) {
          proposal.proposal_status = newStatus;
        }

        const filteredProposal = this.filteredProposals.find(
          p => (p.proposal_id || p.id) === id
        );

        if (filteredProposal) {
          filteredProposal.proposal_status = newStatus;
        }

        this.loader.hide();
        this.toast.show('Proposal status updated', 'success');

      },

      error: () => {

        this.loader.hide();
        this.toast.show('Failed to update proposal status', 'error');

      }

    });

  }

  /* ================= IMAGE HELPER ================= */

  private async loadImageAsBase64(url: string): Promise<string | null> {
    try {
      const res = await fetch(url);
      const blob = await res.blob();

      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  /* ================= PDF WITH IMAGES ================= */

  async generatePDF() {
    setTimeout(() => this.loader.show());

    const element = document.getElementById('proposal-pdf');
    if (!element) {
      setTimeout(() => this.loader.hide());
      return;
    }

    try {
      /* 🔥 CLONE */
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.background = '#ffffff';
      document.body.appendChild(clone);

      /* 🔥 FIND ALL IMAGES */
      const images = clone.querySelectorAll('img');

      /* 🔥 CONVERT IMAGES — SKIP INVERT FOR NON-NUOS PRODUCTS */
      for (const img of Array.from(images)) {
        const src = img.getAttribute('src');
        if (src) {
          const category = img.getAttribute('data-category') || '';
          const shouldInvert = !this.isOriginalImage(category);
          const convertedImg = await this.convertImageColor(src, shouldInvert);
          img.setAttribute('src', convertedImg);
        }
      }

      /* 🔥 GENERATE CANVAS */
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollY: -window.scrollY
      });

      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`proposal-${this.selectedProposal.proposal_id}.pdf`);
      this.toast.show('PDF downloaded', 'success');

    } catch (err) {
      this.toast.show('Failed to generate PDF', 'error');
    }

    setTimeout(() => this.loader.hide());
  }

  filterProposals() {
    const search = this.searchText.toLowerCase();
    const [from, to] = this.proposalDateRangeBounds();

    this.filteredProposals = this.proposals.filter(p => {
      const first = p.client_details?.first_name?.toLowerCase() || '';
      const last = p.client_details?.last_name?.toLowerCase() || '';
      const fullName = `${first} ${last}`;

      const matchesSearch =
        first.includes(search) ||
        last.includes(search) ||
        fullName.includes(search);

      if (!matchesSearch) return false;

      if (from && to) {
        if (!p.created_at) return false;
        const createdAt = new Date(p.created_at).getTime();
        if (createdAt < from.getTime() || createdAt > to.getTime()) return false;
      }

      return true;
    });
  }

  /** Filters client-side (no API cost), so refilter on every change — a single picked
   *  date filters to just that day; picking a second date widens it into a range. */
  onProposalDateRangeChange(range: Date[] | null): void {
    this.proposalDateRange = range;
    this.filterProposals();
  }

  /** [startOfDay, endOfDay] for the selection. A single picked date (no end yet)
   *  is treated as filtering for just that one day. Null when nothing is picked. */
  private proposalDateRangeBounds(): [Date | null, Date | null] {
    const range = this.proposalDateRange;
    if (!range || !range[0]) return [null, null];

    const from = new Date(range[0]);
    from.setHours(0, 0, 0, 0);

    const to = new Date(range[1] || range[0]);
    to.setHours(23, 59, 59, 999);

    return [from, to];
  }

  getColor(value: number): string {
    if (!value) return '#ffffff';

    const hex = value.toString(16).padStart(8, '0'); // AARRGGBB
    return `#${hex.substring(2)}`; // remove alpha → RRGGBB
  }

  /**
   * 🔥 Draws the image onto a canvas and returns a base64 dataURL.
   * If invert = true, converts non-transparent pixels to white (used for
   * category icons shown on colored backgrounds).
   * If invert = false, the original colors are preserved (used for
   * Non-NUOS Products, which should show the real photo).
   */
  async convertImageColor(url: string, invert: boolean): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(url);

        ctx.drawImage(img, 0, 0);

        if (invert) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) { // not transparent
              data[i] = 255;     // R
              data[i + 1] = 255; // G
              data[i + 2] = 255; // B
            }
          }

          ctx.putImageData(imageData, 0, 0);
        }

        resolve(canvas.toDataURL());
      };

      img.onerror = () => resolve(url);
    });
  }

}