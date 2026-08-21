import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';
import { LoaderService } from '../../core/services/loader.service';
import { BaseChartDirective } from 'ng2-charts';
import {
  ChartConfiguration,
  ChartOptions,
  registerables,
  Chart
} from 'chart.js';
import { FormsModule } from '@angular/forms';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {

  summary: any = {};
  roleWiseUsers: any[] = [];
  proposalGraph: any[] = [];

  isLoading = false;

  // ===== Proposal graph =====
  graphType = "day";

  @ViewChild('proposalChartRef') proposalChart?: BaseChartDirective;

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Proposal Count',
        data: [],
        backgroundColor: '#3092f4',
        borderRadius: 6,
        maxBarThickness: 46
      }
    ]
  };

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 0,
    scales: {
      y: { beginAtZero: true }
    }
  };

  // ===== Combined product usage =====
  productsList: any[] = [];
  selectedProductId: string = "";
  selectedProductName: string = "All Products";
  usagePeriod: string = "";

  rawUsageLabels: string[] = [];
  rawUsageData: number[] = [];
  usageChartLabels: string[] = [];
  showAllUsage = false;
  usageTopN = 15;

  isProductDropdownOpen = false;

  @ViewChild('usageChartRef') usageChart?: BaseChartDirective;

  public usageChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Times used',
        data: [],
        backgroundColor: (ctx) => this.getBarGradient(ctx),
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
    resizeDelay: 0,          // <-- important: resize turant apply ho, delay nahi
    animation: { duration: 400 },
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

  constructor(
    private admin: AdminService,
    private loader: LoaderService
  ) { }

  ngOnInit(): void {
    this.fetchDashboard();
    this.fetchProposalGraph();
    this.fetchProductsList();
    this.fetchRankedUsage();
  }

  private getBarGradient(ctx: any) {
    const chart = ctx.chart;
    const { ctx: canvasCtx, chartArea } = chart;
    if (!chartArea) return '#3092f4';

    const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, '#5aa4ff');
    gradient.addColorStop(1, '#2f7ff0');
    return gradient;
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
      },
      error: () => {
        this.isLoading = false;
        this.loader.hide();
      }
    });
  }

  fetchProposalGraph() {
    this.admin.dashboardGraph(this.graphType).subscribe({
      next: (res: any) => {
        this.proposalGraph = res.data.proposalGraph;
        this.loadChart();
      },
      error: (err) => console.log(err)
    });
  }

  onGraphChange() {
    this.fetchProposalGraph();
  }

  loadChart() {
    this.barChartData.labels = this.proposalGraph.map((x: any) => x.label);
    this.barChartData.datasets[0].data =
      this.proposalGraph.map((x: any) => Number(x.proposal_count));

    this.proposalChart?.update();

    // ensure correct size even if canvas rendered with 0 width on first paint
    setTimeout(() => this.proposalChart?.chart?.resize(), 0);
  }

  fetchProductsList() {
    this.admin.getProductsList().subscribe({
      next: (res: any) => {
        this.productsList = res.data || [];
      },
      error: (err) => console.log(err)
    });
  }

  toggleProductDropdown() {
    this.isProductDropdownOpen = !this.isProductDropdownOpen;
  }

  selectProduct(product: any | null) {
    if (product) {
      this.selectedProductId = product.id;
      this.selectedProductName = product.product_name;
    } else {
      this.selectedProductId = "";
      this.selectedProductName = "All Products";
    }
    this.isProductDropdownOpen = false;
    this.onProductSelectChange();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.isProductDropdownOpen = false;
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.usageChart?.chart?.resize();
    this.proposalChart?.chart?.resize();
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
    this.usageChartData.labels = labels;
    this.usageChartData.datasets[0].data = data;

    this.usageChart?.update();

    // KEY FIX: force a resize on next tick so canvas picks up
    // its real container width (fixes blank chart on first page load)
    setTimeout(() => {
      this.usageChart?.chart?.resize();
      this.usageChart?.update();
    }, 0);
  }

  fetchRankedUsage() {
    this.admin.productUsageStats(this.usagePeriod).subscribe({
      next: (res: any) => {
        const data = res.data || [];

        this.rawUsageLabels = data.map((x: any) => x.product_name || `Product #${x.product_id}`);
        this.rawUsageData = data.map((x: any) => Number(x.usage_count));
        this.usageChartData.datasets[0].label = 'Times used';

        this.applyUsageView();
      },
      error: (err) => {
        console.log(err);
        this.rawUsageLabels = [];
        this.rawUsageData = [];
        this.applyUsageView();
      }
    });
  }

  fetchTrendUsage() {
    const period = this.usagePeriod || 'month';

    this.admin.getProductUsageTrend(this.selectedProductId, period).subscribe({
      next: (res: any) => {
        const data = res.data || [];

        this.rawUsageLabels = data.map((x: any) => x.label);
        this.rawUsageData = data.map((x: any) => Number(x.usage_count));
        this.usageChartData.datasets[0].label = 'Usage count';

        this.showAllUsage = true;
        this.applyUsageView();
      },
      error: (err) => {
        console.log(err);
        this.rawUsageLabels = [];
        this.rawUsageData = [];
        this.applyUsageView();
      }
    });
  }

}