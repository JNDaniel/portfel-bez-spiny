import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { RegisterComponent } from './register.component';

function setup(signUp: ReturnType<typeof vi.fn>) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: AuthService, useValue: { signUp } }],
  });
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  const fixture = TestBed.createComponent(RegisterComponent);
  fixture.detectChanges();
  return { fixture, navigate };
}

async function submit(fixture: ReturnType<typeof setup>['fixture']) {
  fixture.componentInstance.form.setValue({ email: 'a@b.pl', password: 'secret1' });
  await fixture.componentInstance.onSubmit();
  fixture.detectChanges();
}

describe('RegisterComponent', () => {
  it('shows the confirmation panel with the email', async () => {
    const { fixture, navigate } = setup(
      vi.fn().mockResolvedValue({ status: 'confirmation-required' }),
    );
    await submit(fixture);
    const panel = fixture.nativeElement.querySelector('[data-testid=auth-confirmation]');
    expect(panel.textContent).toContain('Sprawdź skrzynkę');
    expect(panel.textContent).toContain('a@b.pl');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('navigates to the dashboard when signed in', async () => {
    const { fixture, navigate } = setup(vi.fn().mockResolvedValue({ status: 'signed-in' }));
    await submit(fixture);
    expect(navigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows the error message on failure', async () => {
    const { fixture } = setup(
      vi.fn().mockResolvedValue({ status: 'error', message: 'Konto z tym adresem już istnieje.' }),
    );
    await submit(fixture);
    const error = fixture.nativeElement.querySelector('[data-testid=auth-error]');
    expect(error.textContent).toContain('Konto z tym adresem już istnieje.');
  });
});
