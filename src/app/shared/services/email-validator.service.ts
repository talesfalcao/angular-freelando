import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailValidatorService {
  private readonly emailsCadastrados = [
    'a@a.com',
    'c@c.com'
  ]

  verificarEmailExistente(email: string): Observable<boolean> {
    return of(this.emailsCadastrados.includes(email.toLowerCase())).pipe(delay(1500));
  }
}
