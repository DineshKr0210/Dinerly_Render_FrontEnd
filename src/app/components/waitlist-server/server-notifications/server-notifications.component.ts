import { Component, OnInit } from '@angular/core';

import { ServerNotification } from 'src/app/models/waitlist-server.model';
import { ToastService } from 'src/app/services/toast.service';
import { WaitlistApiServerService } from 'src/app/services/waitlist-api-server.service';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-server-notifications',
  templateUrl: './server-notifications.component.html',
  styleUrls: ['./server-notifications.component.css']
})
export class ServerNotificationsComponent implements OnInit {

  notifications: ServerNotification[] = [];

  isLoading = true;
  isLoadingMore = false;
  hasError = false;
  isLast = false;

  private page = 0;

  /** Notification ids with a mark-as-read request in flight. */
  private pending = new Set<number>();

  constructor(
    private api: WaitlistApiServerService,
    private toast: ToastService
  ) { }

  get unreadCount(): number {
    return this.notifications.filter(item => !item.isRead).length;
  }

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.page = 0;
    this.notifications = [];
    this.isLast = false;
    this.isLoading = true;
    this.hasError = false;

    this.fetchPage();
  }

  loadMore(): void {
    if (this.isLoadingMore || this.isLast) {
      return;
    }

    this.isLoadingMore = true;
    this.fetchPage();
  }

  markRead(notification: ServerNotification): void {
    if (notification.isRead || this.pending.has(notification.id)) {
      return;
    }

    this.pending.add(notification.id);

    this.api.markNotificationRead(notification.id).subscribe({
      next: () => {
        this.pending.delete(notification.id);
        notification.isRead = true;

        this.api.refreshUnreadCount().subscribe();
      },
      error: () => {
        this.pending.delete(notification.id);
        this.toast.error('Could not mark this notification as read.');
      }
    });
  }

  iconFor(notification: ServerNotification): string {
    return notification.type === 'TABLE_ASSIGNED'
      ? 'fa-table-cells'
      : 'fa-bell';
  }

  trackById(_: number, notification: ServerNotification): number {
    return notification.id;
  }

  private fetchPage(): void {
    this.api.getNotifications(this.page, PAGE_SIZE).subscribe({
      next: result => {
        this.notifications = [
          ...this.notifications,
          ...(result?.content ?? [])
        ];

        this.isLast = result?.last ?? true;
        this.page += 1;
        this.isLoading = false;
        this.isLoadingMore = false;
      },
      error: () => {
        this.isLoading = false;
        this.isLoadingMore = false;
        this.hasError = this.notifications.length === 0;

        if (!this.hasError) {
          this.toast.error('Could not load more notifications.');
        }
      }
    });
  }
}
