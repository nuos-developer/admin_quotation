import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
   templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  // toast: Toast | null = null;

toast: any = null;

constructor(private toastService: ToastService) {
  this.toastService.toast$.subscribe(t => {
    this.toast = t;
  });
}
}
