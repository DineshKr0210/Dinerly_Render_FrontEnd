import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private nextId = 1;
  private readonly toastsSubject = new BehaviorSubject<Toast[]>([]);

  readonly toasts$ = this.toastsSubject.asObservable();

  success(message: string, duration = 3200): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 4800): void {
    this.show(message, 'error', duration);
  }

  info(message: string, duration = 3200): void {
    this.show(message, 'info', duration);
  }

  dismiss(id: number): void {
    this.toastsSubject.next(
      this.toastsSubject.value.filter(toast => toast.id !== id)
    );
  }

  private show(message: string, type: ToastType, duration: number): void {
    const id = this.nextId++;

    this.toastsSubject.next([...this.toastsSubject.value, { id, message, type }]);

    setTimeout(() => this.dismiss(id), duration);
  }
}
