import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Login, REMEMBER_COOKIE } from './login';
import { Storage } from '../../../core/services/storage';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let storage: Storage;

  async function createComponent(): Promise<void> {
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([])]
    }).compileComponents();

    storage = TestBed.inject(Storage);
    storage.deleteCookie(REMEMBER_COOKIE);
    sessionStorage.clear();
  });

  afterEach(() => {
    storage.deleteCookie(REMEMBER_COOKIE);
    sessionStorage.clear();
  });

  it('should create', async () => {
    await createComponent();
    expect(component).toBeTruthy();
  });

  it('should save the username in a cookie when "Remember me" is checked', async () => {
    await createComponent();
    component.username = 'student';
    component.password = 'Student123';
    component.rememberMe = true;

    component.login();

    expect(storage.getCookie(REMEMBER_COOKIE)).toBe('student');
  });

  it('should not store a cookie when "Remember me" is unchecked', async () => {
    await createComponent();
    component.username = 'student';
    component.password = 'Student123';
    component.rememberMe = false;

    component.login();

    expect(storage.getCookie(REMEMBER_COOKIE)).toBeNull();
  });

  it('should pre-fill the username from the cookie', async () => {
    storage.setCookie(REMEMBER_COOKIE, 'admin', 30);

    await createComponent();

    expect(component.username).toBe('admin');
    expect(component.rememberMe).toBeTrue();
  });

  it('should not save a cookie when login fails', async () => {
    await createComponent();
    component.username = 'student';
    component.password = 'wrong';
    component.rememberMe = true;

    component.login();

    expect(storage.getCookie(REMEMBER_COOKIE)).toBeNull();
    expect(component.errorMessage).toBe('Invalid username or password.');
  });
});
