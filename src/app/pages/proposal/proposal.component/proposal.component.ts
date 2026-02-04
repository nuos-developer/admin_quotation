import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-proposal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './proposal.component.html',
  styleUrls: ['./proposal.component.scss']
})
export class ProposalComponent implements OnInit {

  proposals: any[] = [];
  selectedProposal: any = null;
  isLoading = false;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadProposals();
  }

  /* ================= LOAD LIST ================= */

  loadProposals() {
    this.isLoading = true;
    this.adminService.getProposals().subscribe({
      next: (res: any) => {
        this.proposals = this.toArray(res?.data?.data);
        this.isLoading = false;
      },
      error: () => this.isLoading = false
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

  async generatePDF() {
    const doc = new jsPDF();
    let y = 15;

    /* ===== HEADER ===== */
    doc.setFontSize(14);
    doc.text('Proposal Details', 14, y);
    y += 10;

    doc.setFontSize(10);
    doc.text(`Proposal ID: ${this.selectedProposal.proposal_id}`, 14, y); y += 6;
    doc.text(`User: ${this.selectedProposal.user_details.userName}`, 14, y); y += 10;

    /* ===== SUMMARY ===== */
    autoTable(doc, {
      startY: y,
      head: [['Field', 'Value']],
      body: [
        ['Installation %', `${this.selectedProposal.installation_percentage}%`],
        ['Commissioning %', `${this.selectedProposal.commissioning_percentage}%`],
        ['Discount %', `${this.selectedProposal.discount_percentage}%`],
        ['Final Total', `${this.selectedProposal.financial_breakdown.finalTotal}`]
      ]
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    /* ===== FLOORS / HOMES / ROOMS ===== */
    for (const floor of this.getFloors()) {
      doc.setFontSize(12);
      doc.text(`Floor: ${floor.name}`, 14, y);
      y += 6;

      for (const home of this.getHomes(floor)) {
        doc.setFontSize(11);
        doc.text(`Home: ${home.name}`, 18, y);
        y += 5;

        for (const room of this.getRooms(home)) {
          doc.text(`Room: ${room.name}`, 22, y);
          y += 4;

          for (const sb of this.getSwitchboards(room)) {

            const products = this.getProducts(sb);
            if (!products.length) continue;

            /* ===== PRODUCT TABLE ===== */
            autoTable(doc, {
              startY: y,
              head: [['Product', 'Category', 'MOD', 'Price']],
              body: products.map(p => [
                p.name,
                p.category,
                p.modSize,
                `${p.price}`
              ]),
              margin: { left: 22 },
              styles: { fontSize: 8 }
            });

            y = (doc as any).lastAutoTable.finalY + 6;

            /* ===== PRODUCT IMAGES ===== */
            let x = 22;
            const imgSize = 30;

            for (const p of products) {
              if (!p.imagePath) continue;

              const imgBase64 = await this.loadImageAsBase64(p.imagePath);
              if (!imgBase64) continue;

              if (x + imgSize > 180) {
                x = 22;
                y += imgSize + 4;
              }

              doc.addImage(imgBase64, 'PNG', x, y, imgSize, imgSize);
              x += imgSize + 4;
            }

            y += imgSize + 10;
          }
        }
      }
    }

    doc.save(`proposal-${this.selectedProposal.proposal_id}.pdf`);
  }
}
