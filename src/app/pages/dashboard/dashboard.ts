import { Component, OnInit , ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';
import { LoaderService } from '../../core/services/loader.service';
import { BaseChartDirective } from 'ng2-charts';
// import { ViewChild } from '@angular/core';
import {
  ChartConfiguration,
  ChartData,
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

  graphType = "month";
   @ViewChild(BaseChartDirective)
  chart?: BaseChartDirective;

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Proposal Count',
        data: [],
        backgroundColor: '#3092f4'
      }
    ]
  };

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
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

      error: (err) => {
        console.log(err);
      }

    });

  }
  onGraphChange() {
    this.fetchProposalGraph();
  }

loadChart() {

  this.barChartData.labels = this.proposalGraph.map((x: any) => x.label);

  this.barChartData.datasets[0].data =
    this.proposalGraph.map((x: any) => Number(x.proposal_count));

  this.chart?.update();

}

}