import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { LoaderService } from '../../../core/services/loader.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-proposal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proposal.component.html',
  styleUrls: ['./proposal.component.scss']
})
export class ProposalComponent implements OnInit {

  proposals: any[] = [];
  selectedProposal: any = null;
  searchText: string = '';
  filteredProposals: any[] = [];

  // 🔥 STATUS OPTIONS
  statusOptions: string[] = ['Pending', 'Completed', 'Rejected'];

  // 🔥 STATUS CONFIRMATION MODAL STATE
  showStatusConfirm: boolean = false;
  statusToConfirm: string = '';

  constructor(
    private adminService: AdminService,
    private loader: LoaderService
  ) { }

  ngOnInit(): void {
    this.loadProposals();
  }

  /* ================= LOAD LIST ================= */
  loadProposals() {
    setTimeout(() => this.loader.show());

    this.adminService.getProposals().subscribe({
      next: (res: any) => {
        console.log(res?.data);
        this.proposals = this.toArray(res?.data?.data);


        this.filteredProposals = [...this.proposals];
        setTimeout(() => this.loader.hide());
      },
      error: () => {
        setTimeout(() => this.loader.hide());
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

      },

      error: (err) => {

        this.loader.hide();
        console.error(err);

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

    } catch (err) {
      console.error(err);
    }

    setTimeout(() => this.loader.hide());
  }

  filterProposals() {
    const search = this.searchText.toLowerCase();

    this.filteredProposals = this.proposals.filter(p => {
      const first = p.client_details?.first_name?.toLowerCase() || '';
      const last = p.client_details?.last_name?.toLowerCase() || '';
      const fullName = `${first} ${last}`;

      return (
        first.includes(search) ||
        last.includes(search) ||
        fullName.includes(search)
      );
    });
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