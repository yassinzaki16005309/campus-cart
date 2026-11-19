
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from './store';
import { Storage } from '../../core/services/storage';
import { Auth } from '../../core/services/auth';

describe('Store', () => {
  let component: Store;
  let fixture: ComponentFixture<Store>;
  let storageMock: jasmine.SpyObj<Storage>;
  let auth: Auth;

  beforeEach(async () => {
    storageMock = jasmine.createSpyObj<Storage>('Storage', [
      'getLocal',
      'setLocal',
      'getSession',
      'setSession',
      'removeSession'
    ]);

    storageMock.getLocal.and.returnValue(null);
    storageMock.getSession.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [Store],
      providers: [
        { provide: Storage, useValue: storageMock }
      ]
    }).compileComponents();

    auth = TestBed.inject(Auth);
    auth.login('student', 'Student123');

    fixture = TestBed.createComponent(Store);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // PRODUCT CATALOGUE
  it('should load the sample products when no saved products exist', () => {
    expect(component.products().length).toBe(6);
  });

  // SHOPPING CART
  it('should add a product to the cart', () => {
    const product = component.products()[0];

    component.addToCart(product);

    expect(component.cart().length).toBe(1);
    expect(component.cartCount()).toBe(1);
  });

  it('should increase quantity when adding the same product again', () => {
    const product = component.products()[0];

    component.addToCart(product);
    component.addToCart(product);

    expect(component.cart()[0].quantity).toBe(2);
    expect(component.cartCount()).toBe(2);
  });

  it('should calculate the cart total correctly', () => {
    const product = component.products()[0];

    component.addToCart(product);
    component.addToCart(product);

    expect(component.cartTotal()).toBe(product.price * 2);
  });

  it('should reject products that are out of stock', () => {
    const product = {
      ...component.products()[0],
      stock: 0
    };

    component.addToCart(product);

    expect(component.cart()).toEqual([]);
    expect(component.errorMessage()).toBe(
      'This product is out of stock.'
    );
  });

  it('should prevent adding more than the available stock', () => {
    const product = {
      ...component.products()[0],
      stock: 1
    };

    component.addToCart(product);
    component.addToCart(product);

    expect(component.cart()[0].quantity).toBe(1);
    expect(component.errorMessage()).toBe(
      'You cannot add more than the available stock.'
    );
  });

  it('should increase and decrease cart quantity', () => {
    const product = component.products()[0];

    component.addToCart(product);
    component.increaseQuantity(product.id);

    expect(component.cart()[0].quantity).toBe(2);

    component.decreaseQuantity(product.id);

    expect(component.cart()[0].quantity).toBe(1);
  });

  it('should remove an item when its quantity reaches zero', () => {
    const product = component.products()[0];

    component.addToCart(product);
    component.decreaseQuantity(product.id);

    expect(component.cart()).toEqual([]);
    expect(component.cartCount()).toBe(0);
  });

  it('should remove a product from the cart', () => {
    const product = component.products()[0];

    component.addToCart(product);
    component.removeFromCart(product.id);

    expect(component.cart()).toEqual([]);
  });

  // CHECKOUT VALIDATION
  it('should reject checkout when the cart is empty', () => {
    component.checkout();

    expect(component.errorMessage()).toBe('Your cart is empty.');
  });

  it('should reject checkout when the user is not logged in', () => {
    auth.logout();

    component.addToCart(component.products()[0]);
    component.checkout();

    expect(component.errorMessage()).toBe(
      'Please log in before checking out.'
    );
    expect(component.cart().length).toBe(1);
  });

  it('should reject checkout when stock is no longer available', () => {
    const product = component.products()[0];

    component.addToCart(product);

    component.products.update(products =>
      products.map(p =>
        p.id === product.id ? { ...p, stock: 0 } : p
      )
    );

    component.checkout();

    expect(component.errorMessage()).toContain(
      'Not enough stock available'
    );
    expect(component.cart().length).toBe(1);
  });

  // PAY NOW CHECKOUT
  it('should record Bookstore income when paying immediately', () => {
    const product = component.products()[0];

    component.addToCart(product);
    component.checkoutOption = 'pay-now';
    component.checkout();

    expect(storageMock.setLocal).toHaveBeenCalledWith(
      'campusCartTransactions',
      jasmine.arrayContaining([
        jasmine.objectContaining({
          department: 'Bookstore',
          type: 'income',
          amount: product.price,
          description: 'Campus store purchase'
        })
      ])
    );
  });

  // ADD TO INVOICE CHECKOUT
  it('should create an unpaid invoice when adding the purchase to student fees', () => {
    const product = component.products()[0];

    component.addToCart(product);
    component.checkoutOption = 'add-to-invoice';
    component.checkout();

    expect(storageMock.setLocal).toHaveBeenCalledWith(
      'campusCartInvoices',
      jasmine.arrayContaining([
        jasmine.objectContaining({
          studentId: 3,
          description: 'Campus store purchase',
          amount: product.price,
          status: 'unpaid'
        })
      ])
    );
  });

  // SUCCESSFUL CHECKOUT
  it('should reduce product stock and clear the cart after checkout', () => {
    const product = component.products()[0];

    component.addToCart(product);
    component.checkout();

    const updatedProduct = component.products().find(
      p => p.id === product.id
    );

    expect(updatedProduct?.stock).toBe(product.stock - 1);
    expect(component.cart()).toEqual([]);

    expect(storageMock.setLocal).toHaveBeenCalledWith(
      'campusCartProducts',
      jasmine.any(Array)
    );
  });
});
