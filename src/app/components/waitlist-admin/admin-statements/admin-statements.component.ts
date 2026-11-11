import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-statements',
  templateUrl: './admin-statements.component.html',
  styleUrls: ['./admin-statements.component.css']
})
export class AdminStatementsComponent {

  currentPlan = 'Multi-location';

  locationCount = 4;

  nextBillingDate = 'Sep 17, 2026';

  monthlyPrice = 'CA$249/mo';

  paymentMethod = 'Visa ending in 4822';

  invoices = [
    {
      id: 'INV-2026-0817',
      date: 'Aug 17, 2026',
      amount: 'CA$249.00',
      status: 'Paid'
    },
    {
      id: 'INV-2026-0717',
      date: 'Jul 17, 2026',
      amount: 'CA$249.00',
      status: 'Paid'
    },
    {
      id: 'INV-2026-0617',
      date: 'Jun 17, 2026',
      amount: 'CA$249.00',
      status: 'Paid'
    },
    {
      id: 'INV-2026-0517',
      date: 'May 17, 2026',
      amount: 'CA$249.00',
      status: 'Paid'
    }
  ];

  changePaymentMethod(): void {
    // Payment API not provided yet.
  }

  downloadInvoice(invoice: any): void {
    // Invoice download API not provided yet.
    console.log('Download invoice:', invoice.id);
  }
}