import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';
import { LoaderService } from '../../core/services/loader.service';
import { ToastService } from '../../core/services/toast.service';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
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
  imports: [CommonModule, ChartModule, FormsModule, SelectModule, ButtonModule, TableModule],
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
  usagePeriod: string = "";

  rawUsageLabels: string[] = [];
  rawUsageData: number[] = [];
  usageChartLabels: string[] = [];
  showAllUsage = false;
  usageTopN = 15;

  get productSelectOptions() {
    return [{ id: '', product_name: 'All Products' }, ...this.productsList];
  }

  private cachedGradient: { gradient: CanvasGradient; top: number; bottom: number } | null = null;

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
    resizeDelay: 0,
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
    private loader: LoaderService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
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

    if (
      this.cachedGradient &&
      this.cachedGradient.top === chartArea.top &&
      this.cachedGradient.bottom === chartArea.bottom
    ) {
      return this.cachedGradient.gradient;
    }

    const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, '#5aa4ff');
    gradient.addColorStop(1, '#2f7ff0');

    this.cachedGradient = { gradient, top: chartArea.top, bottom: chartArea.bottom };
    return this.cachedGradient.gradient;
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
    this.admin.dashboardGraph(this.graphType).subscribe({
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
    this.admin.productUsageStats(this.usagePeriod).subscribe({
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

    this.admin.getProductUsageTrend(this.selectedProductId, period).subscribe({
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

}
