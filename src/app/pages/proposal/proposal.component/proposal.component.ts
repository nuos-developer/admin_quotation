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

  constructor(
    private adminService: AdminService,
    private loader: LoaderService   // 🔥 ADD THIS
  ) { }

  ngOnInit(): void {
    this.loadProposals();
  }

  /* ================= LOAD LIST ================= */
  loadProposals() {
    this.loader.show();

    this.adminService.getProposals().subscribe({
      next: (res: any) => {
        this.proposals = this.toArray(res?.data?.data);
        this.filteredProposals = [...this.proposals]; // ✅ IMPORTANT
        this.loader.hide();
      },
      error: () => {
        this.loader.hide();
      }
    });
  }

  viewProposal(proposal: any) {
    this.selectedProposal = proposal;
  }

  backToList() {
    this.selectedProposal = null;
  }

  /* ================= SAFE ARRAY HELPERS ================= */


  getFloors() {
    console.log(this.selectedProposal?.floor);
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

  //  import html2canvas from 'html2canvas';

  async generatePDF() {
    this.loader.show();

    const element = document.getElementById('proposal-pdf');
    if (!element) {
      this.loader.hide();
      return;
    }

    try {
      /* 🔥 CLONE */
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.background = '#ffffff';
      document.body.appendChild(clone);

      /* 🔥 FIND ALL IMAGES */
      const images = clone.querySelectorAll('img');

      /* 🔥 CONVERT ALL IMAGES TO WHITE */
      for (const img of Array.from(images)) {
        const src = img.getAttribute('src');
        if (src) {
          const whiteImg = await this.convertImageToWhite(src);
          img.setAttribute('src', whiteImg);
        }
      }

      /* 🔥 GENERATE CANVAS */
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollY: -window.scrollY   // 🔥 IMPORTANT
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

    this.loader.hide();
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

  async convertImageToWhite(url: string): Promise<string> {
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

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // 🔥 convert to white
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 0) { // not transparent
            data[i] = 255;     // R
            data[i + 1] = 255; // G
            data[i + 2] = 255; // B
          }
        }

        ctx.putImageData(imageData, 0, 0);

        resolve(canvas.toDataURL());
      };

      img.onerror = () => resolve(url);
    });
  }

}