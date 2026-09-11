import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';
import { LoaderService } from '../../core/services/loader.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SplitButtonModule } from 'primeng/splitbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { MenuItem } from 'primeng/api';
import {
  ChartConfiguration,
  ChartOptions,
  registerables,
  Chart
} from 'chart.js';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChartModule, FormsModule, SelectModule, ButtonModule, TableModule, SplitButtonModule, DatePickerModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {

  summary: any = {};
  roleWiseUsers: any[] = [];
  proposalGraph: any[] = [];

  isLoading = false;

  // ===== Proposal graph =====
  graphType = "day";
  proposalDateRange: Date[] | null = null;

  graphTypeOptions = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Year', value: 'year' }
  ];

  usagePeriodOptions = [
    { label: 'All time', value: '' },
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Year', value: 'year' }
  ];

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Proposal Count',
        data: [],
        backgroundColor: (ctx) => this.getBarGradient(ctx, 'proposal', [[0, '#6fb1ff'], [1, '#3092f4']]),
        hoverBackgroundColor: '#1f6fe0',
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 46,
        barPercentage: 0.6,
        categoryPercentage: 0.7
      }
    ]
  };

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 0,
    animation: this.barEntranceAnimation(),
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e1e2d',
        titleColor: '#fff',
        bodyColor: '#e8e8f0',
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        titleFont: { weight: 'bold', size: 13 },
        bodyFont: { size: 13 },
        callbacks: {
          label: (item) => `  ${item.formattedValue} proposals`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#666', font: { size: 11 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f0f1f5' },
        ticks: { color: '#888', font: { size: 12 } }
      }
    }
  };

  // ===== Combined product usage =====
  productsList: any[] = [];
  selectedProductId: string = "";
  usagePeriod: string = "";
  usageDateRange: Date[] | null = null;

  rawUsageLabels: string[] = [];
  rawUsageData: number[] = [];
  usageChartLabels: string[] = [];
  showAllUsage = false;
  usageTopN = 15;

  get productSelectOptions() {
    return [{ id: '', product_name: 'All Products' }, ...this.productsList];
  }

  get selectedProductName(): string {
    if (!this.selectedProductId) return 'All Products';
    const match = this.productsList.find((p: any) => p.id === this.selectedProductId);
    return match?.product_name || 'Selected Product';
  }

  private gradientCache: Record<string, { gradient: CanvasGradient; top: number; bottom: number }> = {};

  public usageChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Times used',
        data: [],
        backgroundColor: (ctx) => this.getBarGradient(ctx, 'usage', [[0, '#5aa4ff'], [1, '#2f7ff0']]),
        hoverBackgroundColor: '#1f6fe0',
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 40,
        barPercentage: 0.65,
        categoryPercentage: 0.8
      }
    ]
  };

  public usageChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 0,
    animation: this.barEntranceAnimation(),
    layout: {
      padding: { top: 10, right: 10, left: 0, bottom: 0 }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e1e2d',
        titleColor: '#fff',
        bodyColor: '#e8e8f0',
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        titleFont: { weight: 'bold', size: 13 },
        bodyFont: { size: 13 },
        callbacks: {
          label: (item) => `  Used ${item.formattedValue} times`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#666',
          font: { size: 11 },
          maxRotation: 55,
          minRotation: 55
        }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f0f1f5' },
        ticks: { color: '#888', font: { size: 12 } }
      }
    }
  };

  reportMenuItems: MenuItem[] = [
    { label: 'Download PDF', icon: 'pi pi-download', command: () => this.downloadReport() },
    { label: 'Share via Email', icon: 'pi pi-envelope', command: () => this.shareViaEmail() },
    { label: 'Share via WhatsApp', icon: 'pi pi-whatsapp', command: () => this.shareViaWhatsapp() }
  ];

  isAdmin = false;

  constructor(
    private admin: AdminService,
    private loader: LoaderService,
    private toast: ToastService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.isAdmin = this.auth.isAdmin();
  }

  ngOnInit(): void {
    this.fetchDashboard();
    this.fetchProposalGraph();
    this.fetchProductsList();
    this.fetchRankedUsage();
  }

  private getBarGradient(ctx: any, key: string, colorStops: [number, string][]) {
    const chart = ctx.chart;
    const { ctx: canvasCtx, chartArea } = chart;
    if (!chartArea) return colorStops[colorStops.length - 1][1];

    const cached = this.gradientCache[key];
    if (cached && cached.top === chartArea.top && cached.bottom === chartArea.bottom) {
      return cached.gradient;
    }

    const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    colorStops.forEach(([stop, color]) => gradient.addColorStop(stop, color));

    this.gradientCache[key] = { gradient, top: chartArea.top, bottom: chartArea.bottom };
    return this.gradientCache[key].gradient;
  }

  /** Staggered "rise in" entrance animation, replayed each time chart data is updated. */
  private barEntranceAnimation() {
    return {
      duration: 700,
      easing: 'easeOutQuart' as const,
      delay: (context: any) => {
        let delay = 0;
        if (context.type === 'data' && context.mode === 'default' && !context.dropped) {
          delay = context.dataIndex * 40 + context.datasetIndex * 100;
          context.dropped = true;
        }
        return delay;
      }
    };
  }

  fetchDashboard() {
    this.isLoading = true;
    this.loader.show();

    this.admin.dashboard().subscribe({
      next: (res: any) => {
        this.summary = res.data.summary;
        this.roleWiseUsers = res.data.roleWiseUsers;
        this.isLoading = false;
        this.loader.hide();
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.loader.hide();
        this.toast.show('Failed to load dashboard summary', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  fetchProposalGraph() {
    const [from, to] = this.formatRange(this.proposalDateRange);

    this.admin.dashboardGraph(this.graphType, from, to).subscribe({
      next: (res: any) => {
        this.proposalGraph = res.data.proposalGraph;
        this.loadChart();
      },
      error: () => {
        this.toast.show('Failed to load proposal graph', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  onGraphChange() {
    this.fetchProposalGraph();
  }

  /** Fired on every intermediate click while picking a range, and on clear.
   *  Only refetches once both dates are chosen, or once the range is fully cleared. */
  onProposalDateRangeChange(range: Date[] | null) {
    this.proposalDateRange = range;

    const hasFullRange = !!(range && range[0] && range[1]);
    const isCleared = !range || (!range[0] && !range[1]);

    if (hasFullRange || isCleared) {
      this.fetchProposalGraph();
    }
  }

  /** Formats a [start, end] Date range as ['YYYY-MM-DD', 'YYYY-MM-DD'], or [undefined, undefined] when incomplete. */
  private formatRange(range: Date[] | null): [string | undefined, string | undefined] {
    if (range && range[0] && range[1]) {
      return [this.formatDate(range[0]), this.formatDate(range[1])];
    }
    return [undefined, undefined];
  }

  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadChart() {
    this.barChartData = {
      ...this.barChartData,
      labels: this.proposalGraph.map((x: any) => x.label),
      datasets: [
        {
          ...this.barChartData.datasets[0],
          data: this.proposalGraph.map((x: any) => Number(x.proposal_count))
        }
      ]
    };
    this.cdr.markForCheck();
  }

  fetchProductsList() {
    this.admin.getProductsList().subscribe({
      next: (res: any) => {
        this.productsList = res.data || [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.show('Failed to load products list', 'error');
        this.cdr.markForCheck();
      }
    });
  }


  onProductSelectChange() {
    if (this.selectedProductId) {
      this.fetchTrendUsage();
    } else {
      this.fetchRankedUsage();
    }
  }

  onUsagePeriodChange() {
    if (this.selectedProductId) {
      this.fetchTrendUsage();
    } else {
      this.fetchRankedUsage();
    }
  }

  /** Same guard as onProposalDateRangeChange: only refetch once the range is complete or cleared. */
  onUsageDateRangeChange(range: Date[] | null) {
    this.usageDateRange = range;

    const hasFullRange = !!(range && range[0] && range[1]);
    const isCleared = !range || (!range[0] && !range[1]);

    if (hasFullRange || isCleared) {
      this.onProductSelectChange();
    }
  }

  toggleShowAll() {
    this.showAllUsage = !this.showAllUsage;
    this.applyUsageView();
  }

  private applyUsageView() {
    const labels = this.showAllUsage
      ? this.rawUsageLabels
      : this.rawUsageLabels.slice(0, this.usageTopN);

    const data = this.showAllUsage
      ? this.rawUsageData
      : this.rawUsageData.slice(0, this.usageTopN);

    this.usageChartLabels = labels;
    this.usageChartData = {
      ...this.usageChartData,
      labels,
      datasets: [
        {
          ...this.usageChartData.datasets[0],
          data
        }
      ]
    };
    this.cdr.markForCheck();
  }

  fetchRankedUsage() {
    const [from, to] = this.formatRange(this.usageDateRange);

    this.admin.productUsageStats(this.usagePeriod, from, to).subscribe({
      next: (res: any) => {
        const data = res.data || [];

        this.rawUsageLabels = data.map((x: any) => x.product_name || `Product #${x.product_id}`);
        this.rawUsageData = data.map((x: any) => Number(x.usage_count));
        this.usageChartData.datasets[0].label = 'Times used';

        this.applyUsageView();
      },
      error: () => {
        this.toast.show('Failed to load product usage stats', 'error');
        this.rawUsageLabels = [];
        this.rawUsageData = [];
        this.applyUsageView();
      }
    });
  }

  fetchTrendUsage() {
    const period = this.usagePeriod || 'month';
    const [from, to] = this.formatRange(this.usageDateRange);

    this.admin.getProductUsageTrend(this.selectedProductId, period, from, to).subscribe({
      next: (res: any) => {
        const data = res.data || [];

        this.rawUsageLabels = data.map((x: any) => x.label);
        this.rawUsageData = data.map((x: any) => Number(x.usage_count));
        this.usageChartData.datasets[0].label = 'Usage count';

        this.showAllUsage = true;
        this.applyUsageView();
      },
      error: () => {
        this.toast.show('Failed to load product usage trend', 'error');
        this.rawUsageLabels = [];
        this.rawUsageData = [];
        this.applyUsageView();
      }
    });
  }

  /* ================= REPORT: PDF + SHARE ================= */

  private reportFileName(): string {
    return `dashboard-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  }

  private async buildReportPdf(): Promise<jsPDF> {
    const pdf = new jsPDF('p', 'mm', 'a4');

    const marginX = 14;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const headStyles = {
      fillColor: [48, 146, 244] as [number, number, number],
      textColor: 255 as const,
      fontStyle: 'bold' as const,
      fontSize: 10
    };
    const bodyStyles = {
      fontSize: 10,
      textColor: [55, 65, 81] as [number, number, number],
      cellPadding: 5
    };
    const alternateRowStyles = { fillColor: [246, 249, 253] as [number, number, number] };
    let y = 18;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - marginX) {
        pdf.addPage();
        y = 18;
      }
    };

    const sectionTitle = (text: string) => {
      ensureSpace(20);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(text, marginX, y);
      y += 2;
    };

    const finishTable = () => {
      y = (pdf as any).lastAutoTable.finalY + 10;
    };

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Dashboard Report', marginX, y);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    y += 6;
    pdf.text(`Generated: ${new Date().toLocaleString()}`, marginX, y);
    y += 8;

    // ===== Summary =====
    sectionTitle('Summary');
    autoTable(pdf, {
      startY: y,
      margin: { left: marginX, right: marginX },
      head: [['Metric', 'Value']],
      body: [
        ['Total Products', String(this.summary.total_products ?? '-')],
        ['Active Products', String(this.summary.active_products ?? '-')],
        ['Inactive Products', String(this.summary.inactive_products ?? '-')],
        ['Total Proposals', String(this.summary.total_proposals ?? '-')],
        ['Total Clients', String(this.summary.total_clients ?? '-')]
      ],
      theme: 'grid',
      headStyles,
      styles: bodyStyles,
      alternateRowStyles,
      columnStyles: { 1: { halign: 'right' } }
    });
    finishTable();

    // ===== Proposal Graph =====
    const proposalRangeLabel = this.proposalDateRange && this.proposalDateRange[1]
      ? `${this.formatDate(this.proposalDateRange[0])} to ${this.formatDate(this.proposalDateRange[1])}`
      : this.graphType;
    sectionTitle(`Proposal Graph (${proposalRangeLabel})`);
    autoTable(pdf, {
      startY: y,
      margin: { left: marginX, right: marginX },
      head: [['Period', 'Proposal Count']],
      body: this.proposalGraph.length
        ? this.proposalGraph.map((x: any) => [String(x.label), String(x.proposal_count)])
        : [['No data available', '']],
      theme: 'grid',
      headStyles,
      styles: bodyStyles,
      alternateRowStyles,
      columnStyles: { 1: { halign: 'right' } }
    });
    finishTable();

    // ===== Role Wise Users =====
    sectionTitle('Role Wise Users');
    autoTable(pdf, {
      startY: y,
      margin: { left: marginX, right: marginX },
      head: [['Role', 'Total Users', 'Approved', 'Pending']],
      body: this.roleWiseUsers.length
        ? this.roleWiseUsers.map((r: any) => [
            String(r.role_name), String(r.total_users), String(r.approved_users), String(r.pending_users)
          ])
        : [['No data available', '', '', '']],
      theme: 'grid',
      headStyles,
      styles: bodyStyles,
      alternateRowStyles,
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } }
    });
    finishTable();

    // ===== Product Usage =====
    const usageRangeLabel = this.usageDateRange && this.usageDateRange[1]
      ? ` (${this.formatDate(this.usageDateRange[0])} to ${this.formatDate(this.usageDateRange[1])})`
      : '';
    const isSingleProduct = !!this.selectedProductId;
    const usageTitle = isSingleProduct
      ? `Product Usage — ${this.selectedProductName}${usageRangeLabel}`
      : `Product Usage${usageRangeLabel}`;
    const usageColumns = isSingleProduct ? ['Period', 'Usage Count'] : ['Product', 'Times Used'];

    sectionTitle(usageTitle);
    autoTable(pdf, {
      startY: y,
      margin: { left: marginX, right: marginX },
      head: [usageColumns],
      body: this.rawUsageLabels.length
        ? this.rawUsageLabels.map((label, i) => [label, String(this.rawUsageData[i] ?? 0)])
        : [['No data available', '']],
      theme: 'grid',
      headStyles,
      styles: bodyStyles,
      alternateRowStyles,
      columnStyles: { 1: { halign: 'right' } }
    });

    return pdf;
  }

  async downloadReport(): Promise<void> {
    this.loader.show();

    try {
      const pdf = await this.buildReportPdf();
      pdf.save(this.reportFileName());
      this.toast.show('Report downloaded', 'success');
    } catch {
      this.toast.show('Failed to generate report', 'error');
    } finally {
      this.loader.hide();
    }
  }

  async shareReport(): Promise<void> {
    this.loader.show();

    try {
      const pdf = await this.buildReportPdf();
      const blob = pdf.output('blob');
      const file = new File([blob], this.reportFileName(), { type: 'application/pdf' });
      const nav = navigator as any;

      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          title: 'Dashboard Report',
          text: 'Please find the dashboard report attached.'
        });
        this.toast.show('Report shared', 'success');
      } else {
        pdf.save(this.reportFileName());
        this.toast.show('Direct sharing isn\'t supported on this browser — report downloaded instead. Attach it manually to Email/WhatsApp.', 'error');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        this.toast.show('Failed to share report', 'error');
      }
    } finally {
      this.loader.hide();
    }
  }

  async shareViaEmail(): Promise<void> {
    await this.downloadReport();
    window.open(
      `mailto:?subject=${encodeURIComponent('Dashboard Report')}&body=${encodeURIComponent('Please find the dashboard report attached (downloaded to your device — attach it to this email).')}`,
      '_blank'
    );
  }

  async shareViaWhatsapp(): Promise<void> {
    await this.downloadReport();
    window.open(
      `https://wa.me/?text=${encodeURIComponent('Dashboard Report — please see the attached PDF (downloaded to your device).')}`,
      '_blank'
    );
  }

}
