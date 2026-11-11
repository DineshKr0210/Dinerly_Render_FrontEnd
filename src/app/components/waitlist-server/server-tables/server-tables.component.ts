import { Component, OnInit } from '@angular/core';

import { ServerAssignedTable } from 'src/app/models/waitlist-server.model';
import { ToastService } from 'src/app/services/toast.service';
import { WaitlistApiServerService } from 'src/app/services/waitlist-api-server.service';

const ORDER_NOTES_MAX = 2000;

@Component({
  selector: 'app-server-tables',
  templateUrl: './server-tables.component.html',
  styleUrls: ['./server-tables.component.css']
})
export class ServerTablesComponent implements OnInit {

  readonly orderNotesMax = ORDER_NOTES_MAX;

  tables: ServerAssignedTable[] = [];

  isLoading = true;
  hasError = false;

  /** Unsaved order-note text per waitlistId. */
  drafts: Record<number, string> = {};
  saving: Record<number, boolean> = {};

  constructor(
    private api: WaitlistApiServerService,
    private toast: ToastService
  ) { }

  get guestCount(): number {
    return this.tables.reduce(
      (total, table) => total + (table.partySize || 0),
      0
    );
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.hasError = false;

    this.api.getMyTables().subscribe({
      next: tables => {
        this.tables = tables;

        tables.forEach(table => {
          if (this.drafts[table.waitlistId] === undefined) {
            this.drafts[table.waitlistId] = table.orderNotes ?? '';
          }
        });

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.hasError = true;
      }
    });
  }

  draftLength(table: ServerAssignedTable): number {
    return (this.drafts[table.waitlistId] ?? '').length;
  }

  isDirty(table: ServerAssignedTable): boolean {
    return (
      (this.drafts[table.waitlistId] ?? '').trim() !==
      (table.orderNotes ?? '').trim()
    );
  }

  saveNotes(table: ServerAssignedTable): void {
    const id = table.waitlistId;

    if (this.saving[id] || !this.isDirty(table)) {
      return;
    }

    const orderNotes = (this.drafts[id] ?? '').trim();

    this.saving[id] = true;

    this.api.saveOrderNotes(id, orderNotes).subscribe({
      next: saved => {
        this.saving[id] = false;

        const updated: ServerAssignedTable = saved ?? {
          ...table,
          orderNotes,
          orderNotesUpdatedAt: new Date().toISOString()
        };

        this.tables = this.tables.map(item =>
          item.waitlistId === id ? { ...item, ...updated } : item
        );

        this.drafts[id] = updated.orderNotes ?? '';
        this.toast.success('Order notes saved.');
      },
      error: () => {
        this.saving[id] = false;
        this.toast.error('Could not save order notes. Please try again.');
      }
    });
  }

  trackByWaitlistId(_: number, table: ServerAssignedTable): number {
    return table.waitlistId;
  }
}
