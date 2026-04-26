import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastService } from './core/services/toast.service';
import { AuthService } from './core/services/auth.service';   // ✅ ADD THIS

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  toast: any = null;

  constructor(
    private toastService: ToastService,
    private auth: AuthService   // ✅ ADD THIS
  ) {
    this.toastService.toast$.subscribe(t => {
      this.toast = t;
    });
  }

  ngOnInit(): void {
    this.auth.autoLogin();   // 🔥 IMPORTANT
  }
}