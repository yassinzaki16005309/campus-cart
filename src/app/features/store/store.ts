import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Product } from '../../core/models/product.model';
import { Auth } from '../../core/services/auth';
import { StoreIncome } from './store-income';
import { Invoices } from '../student-fees/invoices';

interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-store',
  imports: [DecimalPipe],
  templateUrl: './store.html',
  styleUrl: './store.css',
})
export class Store {
  private auth = inject(Auth);
  private income = inject(StoreIncome);
  private invoices = inject(Invoices);

  products: Product[] = [
    { id: 1, name: 'Notebook A4', description: '200 pages, ruled', category: 'Stationery', price: 45, stock: 50, imageUrl: '' },
    { id: 2, name: 'Pen Pack', description: '10 blue pens', category: 'Stationery', price: 30, stock: 80, imageUrl: '' },
    { id: 3, name: 'GIU Hoodie', description: 'University hoodie', category: 'Clothing', price: 650, stock: 15, imageUrl: '' },
    { id: 4, name: 'USB Flash 64GB', description: 'USB 3.0 drive', category: 'Electronics', price: 220, stock: 25, imageUrl: '' },
    { id: 5, name: 'Calculator', description: 'Scientific calculator', category: 'Electronics', price: 300, stock: 3, imageUrl: '' },
  ];

  cart = signal<CartItem[]>([]);
  message = signal('');

  total = computed(() =>
    this.cart().reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  );

  addToCart(product: Product): void {
    const existing = this.cart().find(i => i.product.id === product.id);
    const quantity = existing ? existing.quantity : 0;

    if (quantity >= product.stock) {
      this.message.set(`Only ${product.stock} of ${product.name} in stock.`);
      return;
    }
    this.message.set('');
    this.cart.set(
      existing
        ? this.cart().map(i => (i.product.id === product.id ? { ...i, quantity: quantity + 1 } : i))
        : [...this.cart(), { product, quantity: 1 }]
    );
  }

  removeFromCart(productId: number): void {
    this.cart.set(this.cart().filter(i => i.product.id !== productId));
  }

  clearCart(): void {
    this.cart.set([]);
  }

  private describeCart(): string {
    return 'Store purchase: ' + this.cart().map(i => `${i.quantity}x ${i.product.name}`).join(', ');
  }

  // Simulated payment: money is received now -> Bookstore income
  payNow(): void {
    if (this.cart().length === 0) {
      return;
    }
    this.income.recordBookstoreIncome(this.total(), this.describeCart());
    this.message.set('Payment received. Thank you!');
    this.clearCart();
  }

  // Added to the student's invoice: not income until the invoice is paid
  addToInvoice(): void {
    const user = this.auth.currentUser();
    if (this.cart().length === 0 || !user) {
      this.message.set('Please log in to add purchases to your invoice.');
      return;
    }
    this.invoices.addStorePurchase(user.id, this.total());
    this.message.set('Added to your invoice. Pay it in Student Fees.');
    this.clearCart();
  }
}
