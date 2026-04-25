import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AdminService } from '../../core/services/admin.service';
import { CommonModule } from '@angular/common';
import { LoaderService } from './../../core/services/loader.service';
import { FormsModule } from '@angular/forms'; // ✅ IMPORTANT

@Component({
  selector: 'app-client.componant',
  standalone: true,
  imports: [CommonModule, FormsModule], // ✅ ADD FormsModule
  templateUrl: './client.componant.html',
  styleUrl: './client.componant.scss',
})
export class ClientComponant implements OnInit {

  clients: any[] = [];
  filteredClients: any[] = [];   // ✅ NEW
  searchText: string = '';       // ✅ NEW

  selectedClient: any = null;
  showModal: boolean = false;
  loading: boolean = true;

  constructor(
    private admin: AdminService,
    private loader: LoaderService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getClientData();
  }

  getClientData() {
    this.loading = true;

    this.admin.getClient().subscribe({
      next: (res: any) => {
        this.clients = [...(res.data || [])];
        this.filteredClients = [...this.clients]; // ✅ IMPORTANT

        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.clients = [];
        this.filteredClients = [];
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  /* ================= SEARCH FILTER ================= */
  filterClients() {
    const search = this.searchText.toLowerCase();

    this.filteredClients = this.clients.filter(client => {
      const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();

      return (
        client.first_name?.toLowerCase().includes(search) ||
        client.last_name?.toLowerCase().includes(search) ||
        fullName.includes(search)
      );
    });
  }

  viewClient(client: any) {
    this.selectedClient = client;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedClient = null;
  }
}