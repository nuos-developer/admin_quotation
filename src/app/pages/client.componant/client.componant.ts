import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminService } from '../../core/services/admin.service';
import { LoaderService } from '../../core/services/loader.service';
import { ToastService } from '../../core/services/toast.service';

interface ClientForm {
  id: number | null;
  first_name: string;
  last_name: string;
  email_id: string;
  mobile_number: string;
  address_line_one: string;
  address_line_two: string;
  country: string;
  state: string;
  district: string;
  pin_code: string;
  company_name: string;
  company_address: string;
  gst: string;
  salesrepincharge: string;
  installation_rep_in_charge: string;
  date_of_installation: string | null;
  lead_source: string;
  site_contractor_name: string;
  site_contractor_phone: string;
  architect_name: string;
  architect_phone: string;
  lead_status_id: number | null;
  reference_id: number | null;
}

@Component({
  selector: 'app-client.componant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client.componant.html',
  styleUrl: './client.componant.scss',
})
export class ClientComponant implements OnInit {

  clients: any[] = [];
  filteredClients: any[] = [];
  searchText: string = '';

  leadStatusList: any[] = [];
  referenceList: any[] = [];

  selectedLeadStatusFilter: number | null = null;
  selectedReferenceFilter: number | null = null;

  leadStatusFilterOpen = false;
  referenceFilterOpen = false;

  selectedClient: any = null;

  showView: boolean = false;
  showAdd: boolean = false;
  showEdit: boolean = false;
  submitted: boolean = false;

  loading: boolean = true;

  form: ClientForm = this.emptyForm();

  constructor(
    private admin: AdminService,
    private loader: LoaderService,
    private toast: ToastService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getClientData();
    this.loadDropdowns();
  }

  /* ================= LOAD ================= */

  getClientData(): void {
    this.loading = true;

    this.admin.getClient().subscribe({
      next: (res: any) => {
        this.clients = [...(res.data || [])];
        this.filteredClients = [...this.clients];
        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.clients = [];
        this.filteredClients = [];
        this.loading = false;
        this.toast.show('Unable to load client list.', 'error');
        this.cd.detectChanges();
      }
    });
  }

  loadDropdowns(): void {
    this.admin.getLeads().subscribe({
      next: (res: any) => {
        this.leadStatusList = res.data || [];
      },
      error: () => {
        this.leadStatusList = [];
      }
    });

    this.admin.getReference().subscribe({
      next: (res: any) => {
        this.referenceList = res.data || [];
      },
      error: () => {
        this.referenceList = [];
      }
    });
  }

  /* ================= SEARCH + FILTER ================= */

  filterClients(): void {
    const search = this.searchText.toLowerCase().trim();

    this.filteredClients = this.clients.filter((client: any) => {
      const fullName = `${client.first_name || ''} ${client.last_name || ''}`.toLowerCase();

      const matchesSearch =
        !search ||
        fullName.includes(search) ||
        (client.email_id || '').toLowerCase().includes(search) ||
        (client.mobile_number || '').toLowerCase().includes(search) ||
        (client.client_id || '').toString().toLowerCase().includes(search);

      return matchesSearch &&
        this.matchesLeadStatusFilter(client) &&
        this.matchesReferenceFilter(client);
    });
  }

  private matchesLeadStatusFilter(client: any): boolean {
    if (this.selectedLeadStatusFilter === null || this.selectedLeadStatusFilter === undefined) {
      return true;
    }

    if (client.lead_status_id !== undefined && client.lead_status_id !== null) {
      return client.lead_status_id === this.selectedLeadStatusFilter;
    }

    // Fallback: client only carries the resolved name, match against it
    const selected = this.leadStatusList.find((l: any) => l.id === this.selectedLeadStatusFilter);
    const selectedName = selected ? (selected.lead_status || selected.name || selected.status_name) : null;

    return selectedName ? client.lead_status === selectedName : true;
  }

  private matchesReferenceFilter(client: any): boolean {
    if (this.selectedReferenceFilter === null || this.selectedReferenceFilter === undefined) {
      return true;
    }

    if (client.reference_id !== undefined && client.reference_id !== null) {
      return client.reference_id === this.selectedReferenceFilter;
    }

    // Fallback: client only carries the resolved name, match against it
    const selected = this.referenceList.find((r: any) => r.id === this.selectedReferenceFilter);
    const selectedName = selected ? (selected.lead_reference || selected.name) : null;

    return selectedName ? client.lead_reference === selectedName : true;
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedLeadStatusFilter = null;
    this.selectedReferenceFilter = null;
    this.filterClients();
  }

  get hasActiveFilters(): boolean {
    return !!this.searchText ||
      this.selectedLeadStatusFilter !== null ||
      this.selectedReferenceFilter !== null;
  }

  /* ================= FILTER DROPDOWNS (scrollable) ================= */

  toggleLeadStatusFilter(): void {
    this.referenceFilterOpen = false;
    this.leadStatusFilterOpen = !this.leadStatusFilterOpen;
  }

  toggleReferenceFilter(): void {
    this.leadStatusFilterOpen = false;
    this.referenceFilterOpen = !this.referenceFilterOpen;
  }

  closeFilterDropdowns(): void {
    this.leadStatusFilterOpen = false;
    this.referenceFilterOpen = false;
  }

  selectLeadStatusFilter(id: number | null): void {
    this.selectedLeadStatusFilter = id;
    this.leadStatusFilterOpen = false;
    this.filterClients();
  }

  selectReferenceFilter(id: number | null): void {
    this.selectedReferenceFilter = id;
    this.referenceFilterOpen = false;
    this.filterClients();
  }

  getLeadStatusFilterLabel(): string {
    if (this.selectedLeadStatusFilter === null) {
      return 'All Lead Status';
    }

    const item = this.leadStatusList.find((l: any) => l.id === this.selectedLeadStatusFilter);
    return item ? (item.lead_status || item.name || item.status_name) : 'All Lead Status';
  }

  getReferenceFilterLabel(): string {
    if (this.selectedReferenceFilter === null) {
      return 'All Reference';
    }

    const item = this.referenceList.find((r: any) => r.id === this.selectedReferenceFilter);
    return item ? (item.lead_reference || item.name) : 'All Reference';
  }

  /* ================= VIEW ================= */

  viewClient(client: any): void {
    this.selectedClient = client;
    this.showView = true;
  }

  /* ================= ADD ================= */

  openAdd(): void {
    this.submitted = false;
    this.form = this.emptyForm();
    this.showAdd = true;
  }

  /* ================= EDIT ================= */

  editClient(client: any): void {
    this.submitted = false;

    this.form = {
      id: client.id,
      first_name: client.first_name || '',
      last_name: client.last_name || '',
      email_id: client.email_id || '',
      mobile_number: client.mobile_number || '',
      address_line_one: client.address_line_one || '',
      address_line_two: client.address_line_two || '',
      country: client.country || '',
      state: client.state || '',
      district: client.district || '',
      pin_code: client.pin_code || '',
      company_name: client.company_name || '',
      company_address: client.company_address || '',
      gst: client.gst || '',
      salesrepincharge: client.salesrepincharge || '',
      installation_rep_in_charge: client.installation_rep_in_charge || '',
      date_of_installation: this.toInputDate(client.date_of_installation),
      lead_source: client.lead_source || '',
      site_contractor_name: client.site_contractor_name || '',
      site_contractor_phone: client.site_contractor_phone || '',
      architect_name: client.architect_name || '',
      architect_phone: client.architect_phone || '',
      lead_status_id: client.lead_status_id ?? null,
      reference_id: client.reference_id ?? null
    };

    this.showEdit = true;
  }

  /* ================= SAVE ================= */

  saveClient(): void {
    this.submitted = true;

    if (!this.validateForm()) {
      return;
    }

    const payload = {
      first_name: this.form.first_name,
      last_name: this.form.last_name,
      email_id: this.form.email_id,
      mobile_number: this.form.mobile_number,
      address_line_one: this.form.address_line_one,
      address_line_two: this.form.address_line_two,
      country: this.form.country,
      state: this.form.state,
      district: this.form.district,
      pin_code: this.form.pin_code,
      company_name: this.form.company_name,
      company_address: this.form.company_address,
      gst: this.form.gst,
      salesrepincharge: this.form.salesrepincharge,
      installation_rep_in_charge: this.form.installation_rep_in_charge,
      date_of_installation: this.toApiDate(this.form.date_of_installation),
      lead_source: this.form.lead_source,
      site_contractor_name: this.form.site_contractor_name,
      site_contractor_phone: this.form.site_contractor_phone,
      architect_name: this.form.architect_name,
      architect_phone: this.form.architect_phone,
      lead_status_id: this.form.lead_status_id,
      reference_id: this.form.reference_id,
      created_by: 1
    };

    // this.loader.show();

    if (this.showAdd) {
      this.admin.createClient(payload).subscribe({
        next: () => {
          this.toast.show('Client created successfully.', 'success');
          this.loader.hide();
          this.closeModal();
          this.getClientData();
        },
        error: (err: any) => {
          this.toast.show(err?.error?.message || 'Unable to create client.', 'error');
          this.loader.hide();
        }
      });
    } else {
      this.admin.updateClient(this.form.id as number, payload).subscribe({
        next: () => {
          this.toast.show('Client updated successfully.', 'success');
          this.loader.hide();
          this.closeModal();
          this.getClientData();
        },
        error: (err: any) => {
          this.toast.show(err?.error?.message || 'Unable to update client.', 'error');
          this.loader.hide();
        }
      });
    }
  }

  validateForm(): boolean {
    if (!this.form.first_name?.trim()) return false;
    if (!this.form.last_name?.trim()) return false;
    if (!this.form.email_id?.trim()) return false;
    if (!this.form.mobile_number?.trim()) return false;
    if (this.form.lead_status_id === null || this.form.lead_status_id === undefined) return false;
    if (this.form.reference_id === null || this.form.reference_id === undefined) return false;

    return true;
  }

  /* ================= HELPERS ================= */

  closeModal(): void {
    this.showView = false;
    this.showAdd = false;
    this.showEdit = false;
    this.selectedClient = null;
    this.submitted = false;
  }

  private emptyForm(): ClientForm {
    return {
      id: null,
      first_name: '',
      last_name: '',
      email_id: '',
      mobile_number: '',
      address_line_one: '',
      address_line_two: '',
      country: '',
      state: '',
      district: '',
      pin_code: '',
      company_name: '',
      company_address: '',
      gst: '',
      salesrepincharge: '',
      installation_rep_in_charge: '',
      date_of_installation: null,
      lead_source: '',
      site_contractor_name: '',
      site_contractor_phone: '',
      architect_name: '',
      architect_phone: '',
      lead_status_id: null,
      reference_id: null
    };
  }

  /* ================= DATE FORMAT HELPERS ================= */

  /**
   * <input type="date"> only accepts/emits YYYY-MM-DD.
   * Converts an incoming DD/MM/YYYY (or ISO) string from the API
   * into YYYY-MM-DD so it can be bound to the date input.
   */
  private toInputDate(value: string | null | undefined): string | null {
    if (!value) return null;

    if (value.includes('/')) {
      const [day, month, year] = value.split('/');
      if (!day || !month || !year) return null;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Already ISO (e.g. 2025-11-12 or 2025-11-12T00:00:00.000Z)
    return value.substring(0, 10);
  }

  /**
   * Converts the date input's YYYY-MM-DD value into DD/MM/YYYY
   * for the payload sent to the backend.
   */
  private toApiDate(value: string | null | undefined): string | null {
    if (!value) return null;

    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return null;

    return `${day}/${month}/${year}`;
  }

  /**
   * Formats a stored date (DD/MM/YYYY or ISO) as DD/MM/YYYY for
   * read-only display in the View page.
   */
  formatDisplayDate(value: string | null | undefined): string {
    if (!value) return '-';

    if (value.includes('/')) {
      return value;
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return value;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  /* ================= LEAD STATUS / REFERENCE LOOKUPS ================= */

  getLeadStatusName(client: any): string {
    if (!client) return '-';

    if (client.lead_status) {
      return client.lead_status;
    }

    const status = this.leadStatusList.find((l: any) => l.id === client.lead_status_id);
    return status ? (status.lead_status || status.name || status.status_name) : '-';
  }

  getReferenceName(client: any): string {
    if (!client) return '-';

    if (client.lead_reference) {
      return client.lead_reference;
    }

    const ref = this.referenceList.find((r: any) => r.id === client.reference_id);
    return ref ? (ref.lead_reference || ref.name) : '-';
  }
}