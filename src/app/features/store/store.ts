
import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Product } from '../../core/models/product.model';
import { Invoice } from '../../core/models/invoice.model';
import { Transaction } from '../../core/models/transaction.model';
import { Storage } from '../../core/services/storage';
import { Auth } from '../../core/services/auth';
import { FormsModule } from '@angular/forms';

interface CartItem {
  product: Product;
  quantity: number;
}

type CheckoutOption = 'pay-now' | 'add-to-invoice';

const PRODUCTS_KEY = 'campusCartProducts';
const INVOICES_KEY = 'campusCartInvoices';
const TRANSACTIONS_KEY = 'campusCartTransactions';

@Component({
  selector: 'app-store',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './store.html',
  styleUrl: './store.css',
})
export class Store {
  private storage = inject(Storage);
  private auth = inject(Auth);

  // Sample products for the initial store catalogue

private sampleProducts: Product[] = [
  {
    id: 1,
    name: 'Introduction to Programming',
    description: 'Programming textbook for computer science students.',
    category: 'Books',
    price: 450,
    stock: 15,
    imageUrl: '/images/products/python_book.jfif'
  },
  {
    id: 2,
    name: 'Data Structures and Algorithms',
    description: 'Essential textbook covering algorithms and data structures.',
    category: 'Books',
    price: 550,
    stock: 12,
    imageUrl: '/images/products/DS_book.png'
  },
  {
    id: 3,
    name: 'Laboratory Coat',
    description: 'White laboratory coat for university laboratory sessions.',
    category: 'Lab Equipment',
    price: 350,
    stock: 20,
    imageUrl: '/images/products/lab_coat.webp'
  },
  {
    id: 4,
    name: 'Campus Hoodie',
    description: 'Comfortable hoodie with CampusCart university branding.',
    category: 'Merchandise',
    price: 700,
    stock: 10,
    imageUrl: '/images/products/campus_hoodie.webp'
  },
  {
    id: 5,
    name: 'University Notebook',
    description: 'Notebook for lectures and university notes.',
    category: 'Stationery',
    price: 120,
    stock: 30,
    imageUrl: '/images/products/notebook.jpeg'
  },
  {
    id: 6,
    name: 'Campus Water Bottle',
    description: 'Reusable university-branded water bottle.',
    category: 'Merchandise',
    price: 180,
    stock: 18,
    imageUrl: '/images/products/bottle.webp'
  }
];


  // Product catalogue
 products = signal<Product[]>(this.loadProducts());
 private loadProducts(): Product[] {
  const savedProducts =
    this.storage.getLocal<Product[]>(PRODUCTS_KEY);

  // First-time visitors receive the default products.
  if (!savedProducts) {
    return this.sampleProducts;
  }

  // Update missing image paths without changing other product information.
  const updatedProducts = savedProducts.map(product => {
    const sampleProduct = this.sampleProducts.find(
      sample => sample.id === product.id
    );

    if (!sampleProduct || product.imageUrl) {
      return product;
    }

    return {
      ...product,
      imageUrl: sampleProduct.imageUrl
    };
  });

  // Save the updated products only if an image path was added.
  if (updatedProducts.some(
    (product, index) =>
      product.imageUrl !== savedProducts[index].imageUrl
  )) {
    this.storage.setLocal(PRODUCTS_KEY, updatedProducts);
  }

  return updatedProducts;
}

  // Shopping cart
  cart = signal<CartItem[]>([]);

  // Checkout option
  checkoutOption: CheckoutOption = 'pay-now';

  errorMessage = signal('');
  successMessage = signal('');

  // Number of products in the cart
  cartCount = computed(() =>
    this.cart().reduce((total, item) => total + item.quantity, 0)
  );

  // Total price of the cart
  cartTotal = computed(() =>
    this.cart().reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    )
  );

  // Add product to cart
  addToCart(product: Product): void {
    if (product.stock <= 0) {
      this.errorMessage.set('This product is out of stock.');
      return;
    }

    const existingItem = this.cart().find(
      item => item.product.id === product.id
    );

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        this.errorMessage.set('You cannot add more than the available stock.');
        return;
      }

      this.cart.update(items =>
        items.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      this.cart.update(items => [
        ...items,
        { product, quantity: 1 }
      ]);
    }

    this.errorMessage.set('');
    this.successMessage.set(`${product.name} added to cart.`);
  }

  // Increase product quantity
  increaseQuantity(productId: number): void {
    const product = this.products().find(p => p.id === productId);
    const item = this.cart().find(i => i.product.id === productId);

    if (!product || !item || item.quantity >= product.stock) {
      return;
    }

    this.cart.update(items =>
      items.map(i =>
        i.product.id === productId
          ? { ...i, quantity: i.quantity + 1 }
          : i
      )
    );
  }

  // Decrease product quantity
  decreaseQuantity(productId: number): void {
    this.cart.update(items =>
      items
        .map(item =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  }

  // Remove product from cart
  removeFromCart(productId: number): void {
    this.cart.update(items =>
      items.filter(item => item.product.id !== productId)
    );
  }

  // Complete checkout
  checkout(): void {
    const items = this.cart();

    if (items.length === 0) {
      this.errorMessage.set('Your cart is empty.');
      return;
    }

    // Check that all requested quantities are still available
    for (const item of items) {
      const product = this.products().find(
        p => p.id === item.product.id
      );

      if (!product || product.stock < item.quantity) {
        this.errorMessage.set(
          `Not enough stock available for ${item.product.name}.`
        );
        return;
      }
    }

    const user = this.auth.currentUser();

    if (!user) {
      this.errorMessage.set('Please log in before checking out.');
      return;
    }

    const total = this.cartTotal();
    const today = this.getToday();

    if (this.checkoutOption === 'pay-now') {
      // Simulated payment for Milestone 1
      this.recordBookstoreIncome(total, today);

      this.successMessage.set(
        `Payment successful! Your purchase total is EGP ${total}.`
      );
    } else {
      // Create an unpaid invoice for the store purchase
      this.createStoreInvoice(user.id, total, today);

      this.successMessage.set(
        'Your purchase has been added to your student fees as an unpaid invoice.'
      );
    }

    // Reduce stock after successful checkout
    const updatedProducts = this.products().map(product => {
      const purchasedItem = items.find(
        item => item.product.id === product.id
      );

      return purchasedItem
        ? { ...product, stock: product.stock - purchasedItem.quantity }
        : product;
    });

    this.products.set(updatedProducts);
    this.storage.setLocal(PRODUCTS_KEY, updatedProducts);

    // Clear cart
    this.cart.set([]);
    this.errorMessage.set('');
  }

  // Add completed store sale to Member 3's Budget transactions
  private recordBookstoreIncome(amount: number, date: string): void {
    const transactions =
      this.storage.getLocal<Transaction[]>(TRANSACTIONS_KEY) ?? [];

    const nextId = transactions.length > 0
      ? Math.max(...transactions.map(t => t.id)) + 1
      : 1;

    const transaction: Transaction = {
      id: nextId,
      department: 'Bookstore',
      type: 'income',
      amount,
      date,
      description: 'Campus store purchase'
    };

    this.storage.setLocal(
      TRANSACTIONS_KEY,
      [...transactions, transaction]
    );
  }

  // Create an unpaid invoice for a store purchase
  private createStoreInvoice(
    studentId: number,
    amount: number,
    date: string
  ): void {
    const invoices =
      this.storage.getLocal<Invoice[]>(INVOICES_KEY) ?? [];

    const nextId = invoices.length > 0
      ? Math.max(...invoices.map(invoice => invoice.id)) + 1
      : 1;

    const invoice: Invoice = {
      id: nextId,
      studentId,
      description: 'Campus store purchase',
      amount,
      status: 'unpaid',
      issueDate: date,
      dueDate: this.getDueDate()
    };

    this.storage.setLocal(INVOICES_KEY, [
      ...invoices,
      invoice
    ]);
  }

  // Get today's date
  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Set invoice due date to 30 days from today
  private getDueDate(): string {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate.toISOString().split('T')[0];
  }
}
