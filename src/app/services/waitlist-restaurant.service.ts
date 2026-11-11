import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AddGuestForm, Guest, GuestStatus, HistoryEntry, RestaurantTable } from '../models/waitlist-restaurant.model';

@Injectable({
  providedIn: 'root'
})
export class WaitlistRestaurantService {

  private nextId = 100;

  private guestsSubject = new BehaviorSubject<Guest[]>([
    { id: 1, position: 1, name: 'Chen Party', partySize: 4, phone: '(204) 555-0182', status: 'table-ready', preference: 'Patio preferred', tags: ['Birthday'], notes: '', waitMinutes: 361, addedAt: new Date() },
    { id: 2, position: 2, name: 'Thompson, R.', partySize: 2, phone: '(204) 555-0110', status: 'notified', preference: 'Indoor', tags: [], notes: '', waitMinutes: 347, addedAt: new Date() },
    { id: 3, position: 3, name: 'Patel, S.', partySize: 6, phone: '(204) 555-0203', status: 'waiting', preference: 'No preference', tags: ['Large party', 'Anniversary'], notes: '', waitMinutes: 342, addedAt: new Date() },
    { id: 4, position: 4, name: 'Garcia, M.', partySize: 3, phone: '(204) 555-0145', status: 'waiting', preference: 'No preference', tags: ['High chair'], notes: '', waitMinutes: 337, addedAt: new Date() },
    { id: 5, position: 5, name: 'Williams, J.', partySize: 2, phone: '(204) 555-0077', status: 'overdue', preference: 'Bar seating OK', tags: [], notes: '', waitMinutes: 371, addedAt: new Date() },
    { id: 6, position: 6, name: 'Kim, L.', partySize: 5, phone: '(204) 555-0398', status: 'waiting', preference: 'Quiet section', tags: ['VIP'], notes: '', waitMinutes: 331, addedAt: new Date() },
  ]);

  private tablesSubject = new BehaviorSubject<RestaurantTable[]>([
    // { id: 'T1', seats: 2, status: 'open', info: 'Open' },
    // { id: 'T2', seats: 4, status: 'seated', info: '48 min' },
    // { id: 'T3', seats: 4, status: 'seated', info: '22 min' },
    // { id: 'T4', seats: 6, status: 'reserved', info: '7:30 PM' },
    // { id: 'T5', seats: 2, status: 'seated', info: '31 min' },
    // { id: 'T6', seats: 4, status: 'open', info: 'Open' },
    // { id: 'T7', seats: 6, status: 'seated', info: '14 min' },
    // { id: 'T8', seats: 4, status: 'seated', info: '55 min' },
    // { id: 'T9', seats: 2, status: 'dirty', info: 'Needs clean' },
    // { id: 'T10', seats: 8, status: 'seated', info: '9 min' },
    // { id: 'T11', seats: 2, status: 'open', info: 'Open' },
    // { id: 'T12', seats: 4, status: 'reserved', info: '8:00 PM' },
    // { id: 'T13', seats: 4, status: 'seated', info: '38 min' },
    // { id: 'T14', seats: 6, status: 'seated', info: '17 min' },
    // { id: 'T15', seats: 4, status: 'seated', info: '42 min' },
    // { id: 'T16', seats: 4, status: 'reserved', info: '8:30 PM' },
    // { id: 'T17', seats: 10, status: 'open', info: 'Open' },
    // { id: 'T18', seats: 6, status: 'seated', info: '26 min' },
    // { id: 'T19', seats: 4, status: 'seated', info: '11 min' },
    // { id: 'T20', seats: 2, status: 'seated', info: '33 min' },
  ]);

  private historySubject = new BehaviorSubject<HistoryEntry[]>([
    { id: 1, name: 'Rodriguez, A.', partySize: 2, addedTime: '5:12 PM', seatedTime: '5:28 PM', waitMinutes: 16, tableId: 'T2', status: 'seated' },
    { id: 2, name: 'Okafor, N.', partySize: 5, addedTime: '5:40 PM', seatedTime: '6:08 PM', waitMinutes: 28, tableId: 'T7', status: 'seated' },
    { id: 3, name: 'Lefebvre, C.', partySize: 3, addedTime: '6:00 PM', seatedTime: '—', waitMinutes: null, tableId: '—', status: 'noshow' },
    { id: 4, name: 'Singh, P.', partySize: 4, addedTime: '6:15 PM', seatedTime: '6:44 PM', waitMinutes: 29, tableId: 'T4', status: 'seated' },
    { id: 5, name: 'Beaumont, T.', partySize: 2, addedTime: '6:50 PM', seatedTime: '—', waitMinutes: null, tableId: '—', status: 'left' },
  ]);

  private smsTemplateSubject = new BehaviorSubject<string>(
    'Hi {name}! Your table is ready at Dinerly. Please check in at the host stand within 10 minutes. We look forward to serving you! — The Dinerly Team'
  );

  guests$: Observable<Guest[]> = this.guestsSubject.asObservable();
  tables$: Observable<RestaurantTable[]> = this.tablesSubject.asObservable();
  history$: Observable<HistoryEntry[]> = this.historySubject.asObservable();
  smsTemplate$: Observable<string> = this.smsTemplateSubject.asObservable();

  get guests(): Guest[] { return this.guestsSubject.getValue(); }
  get tables(): RestaurantTable[] { return this.tablesSubject.getValue(); }
  get history(): HistoryEntry[] { return this.historySubject.getValue(); }
  get smsTemplate(): string { return this.smsTemplateSubject.getValue(); }

  addGuest(form: AddGuestForm): void {
    const guests = this.guests;
    const newGuest: Guest = {
      id: this.nextId++,
      position: guests.length + 1,
      name: form.name,
      partySize: form.partySize,
      phone: form.phone || '—',
      status: 'waiting',
      preference: form.preference,
      tags: form.tags,
      notes: form.notes,
      waitMinutes: 0,
      addedAt: new Date(),
    };
    this.guestsSubject.next([...guests, newGuest]);
  }

  removeGuest(id: number): void {
    this.guestsSubject.next(this.guests.filter(g => g.id !== id));
    this.reindexPositions();
  }

  seatGuest(id: number): void {
    const guest = this.guests.find(g => g.id === id);
    if (!guest) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const entry: HistoryEntry = {
      id: this.nextId++,
      name: guest.name,
      partySize: guest.partySize,
      addedTime: guest.addedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      seatedTime: timeStr,
      waitMinutes: guest.waitMinutes,
      tableId: 'T1',
      status: 'seated',
    };
    this.historySubject.next([entry, ...this.history]);
    this.removeGuest(id);
  }

  updateGuestStatus(id: number, status: GuestStatus): void {
    this.guestsSubject.next(this.guests.map(g => g.id === id ? { ...g, status } : g));
  }

  updateSmsTemplate(template: string): void {
    this.smsTemplateSubject.next(template);
  }

  getNotifyQueue(): Guest[] {
    return this.guests.filter(g => g.status === 'table-ready' || g.status === 'notified' || g.status === 'overdue');
  }

  getStats() {
    const guests = this.guests;
    const history = this.history;
    const seatedToday = history.filter(h => h.status === 'seated').length;
    const noShows = history.filter(h => h.status === 'noshow').length;
    return {
      waitingNow: guests.length,
      avgWait: 22,
      seatedToday,
      noShows,
    };
  }

  private reindexPositions(): void {
    this.guestsSubject.next(this.guests.map((g, i) => ({ ...g, position: i + 1 })));
  }

  getInitials(name: string): string {
    return name.split(/[\s,]+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  getAvatarColor(id?: number): { color: string; bg: string } {

  const colors = [

    { color: '#6d28d9', bg: '#ede9fe' },

    { color: '#0891b2', bg: '#cffafe' },

    { color: '#16a34a', bg: '#dcfce7' },

    { color: '#ea580c', bg: '#ffedd5' },

    { color: '#dc2626', bg: '#fee2e2' }

  ];

  if (id == null) {

    return colors[0];

  }

  return colors[id % colors.length];

}

  
}

