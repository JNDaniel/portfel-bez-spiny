import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { LoginComponent } from './login.component';

function setup(signIn: ReturnType<typeof vi.fn>) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: AuthService, useValue: { signIn } }],
  });
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  const fixture = TestBed.createComponent(LoginComponent);
  fixture.detectChanges();
  return { fixture, navigate };
}

async function submit(fixture: ReturnType<typeof setup>['fixture']) {
  fixture.componentInstance.form.setValue({ email: 'a@b.pl', password: 'secret1' });
  await fixture.componentInstance.onSubmit();
  fixture.detectChanges();
}

describe('LoginComponent', () => {
  it('shows the error message when sign-in fails', async () => {
    const { fixture, navigate } = setup(
      vi.fn().mockResolvedValue({ ok: false, message: 'Nieprawidłowy email lub hasło.' }),
    );
    await submit(fixture);
    const error = fixture.nativeElement.querySelector('[data-testid=auth-error]');
    expect(error.textContent).toContain('Nieprawidłowy email lub hasło.');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('re-enables the submit button when sign-in rejects', async () => {
    const { fixture } = setup(vi.fn().mockRejectedValue(new Error('network')));
    fixture.componentInstance.form.setValue({ email: 'a@b.pl', password: 'secret1' });
    await expect(fixture.componentInstance.onSubmit()).rejects.toThrow('network');
    fixture.detectChanges();
    expect(fixture.componentInstance.pending()).toBe(false);
    expect(fixture.nativeElement.querySelector('button[type=submit]').disabled).toBe(false);
  });

  it('explains an invalid email once the field is touched', () => {
    const { fixture } = setup(vi.fn());
    const email = fixture.componentInstance.form.get('email')!;
    email.setValue('nie-email');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Podaj poprawny adres email.');
    email.markAsTouched();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Podaj poprawny adres email.');
  });

  it('navigates to the dashboard on success', async () => {
    const { fixture, navigate } = setup(vi.fn().mockResolvedValue({ ok: true }));
    await submit(fixture);
    expect(navigate).toHaveBeenCalledWith('/dashboard');
  });
});
