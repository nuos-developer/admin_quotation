import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private messageService: MessageService) {}

  show(message: string, type: 'success' | 'error' = 'success') {
    this.messageService.add({
      severity: type === 'success' ? 'success' : 'error',
      summary: type === 'success' ? 'Success' : 'Error',
      detail: message,
      life: 3000
    });
  }

  success(message: string) {
    this.show(message, 'success');
  }

  error(message: string) {
    this.show(message, 'error');
  }
}
