import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from './store';
import { Auth } from '../../core/services/auth';
import { TRANSACTIONS_KEY } from './store-income';

describe('Store', () => {
  let fixture: ComponentFixture<Store>;
  let component: Store;
  let el: HTMLElement;

  const click = async (selector: string, index = 0) => {
    (el.querySelectorAll(selector)[index] as HTMLButtonElement).click();
    await fixture.whenStable();
  };
  const transactions = () => JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) ?? '[]');

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await TestBed.configureTestingModule({ imports: [Store] }).compileComponents();
    fixture = TestBed.createComponent(Store);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should create and show every product', () => {
    expect(component).toBeTruthy();
    expect(el.querySelectorAll('.product').length).toBe(component.products.length);
  });

  it('shows an empty cart at the start', () => {
    expect(el.querySelector('.cart__empty')).not.toBeNull();
    expect(el.querySelector<HTMLButtonElement>('.cart__pay-now')!.disabled).toBe(true);
  });

  it('adds to the cart and updates the total on click', async () => {
    await click('.product__add', 0); // Notebook 45
    await click('.product__add', 0);
    await click('.product__add', 1); // Pens 30

    expect(component.total()).toBe(120);
    expect(el.querySelector('.cart__total')?.textContent).toContain('120.00');
  });

  it('does not allow more than the stock', async () => {
    const calculator = component.products.find(p => p.stock === 3)!;
    for (let i = 0; i < 5; i++) component.addToCart(calculator);

    expect(component.cart()[0].quantity).toBe(3);
    expect(component.message()).toContain('in stock');
  });

  it('removes an item from the cart', async () => {
    await click('.product__add', 0);
    await click('.cart__remove');

    expect(component.cart().length).toBe(0);
  });

  it('Pay now writes one Bookstore income transaction and empties the cart', async () => {
    await click('.product__add', 0);
    await click('.product__add', 1);
    await click('.cart__pay-now');

    expect(transactions().length).toBe(1);
    expect(transactions()[0]).toMatchObject({ department: 'Bookstore', type: 'income', amount: 75 });
    expect(component.cart().length).toBe(0);
  });

  it('Add to invoice writes NO transaction (money not received yet)', async () => {
    TestBed.inject(Auth).login('student', 'Student123');
    await click('.product__add', 0);
    await click('.cart__add-invoice');

    expect(transactions().length).toBe(0);
    expect(JSON.parse(localStorage.getItem('campusCartInvoices')!)[0]).toMatchObject({ studentId: 3, amount: 45, status: 'unpaid' });
  });

  it('Add to invoice needs a logged-in user and keeps the cart', async () => {
    await click('.product__add', 0);
    await click('.cart__add-invoice');

    expect(component.message()).toContain('log in');
    expect(component.cart().length).toBe(1);
    expect(localStorage.getItem('campusCartInvoices')).toBeNull();
  });
});
