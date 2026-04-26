import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  message: string;
  type: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {

  private toastSubject = new BehaviorSubject<Toast | null>(null);
  toast$ = this.toastSubject.asObservable();

  private timeoutRef: any; // ✅ store timer

  show(message: string, type: 'success' | 'error' = 'success') {

    // ✅ clear old timer
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
    }

    this.toastSubject.next({ message, type });

    // ✅ new timer
    this.timeoutRef = setTimeout(() => {
      this.toastSubject.next(null);
    }, 2000);
  }
}