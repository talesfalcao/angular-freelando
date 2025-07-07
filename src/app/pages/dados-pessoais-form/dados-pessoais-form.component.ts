import { Cidade, Estado, IbgeService } from './../../shared/services/ibge.service';
import { CadastroService } from './../../shared/services/cadastro.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, AbstractControlOptions, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, startWith, switchMap, tap } from 'rxjs';
import { cpfValidator } from '../../shared/validators/cpf.validator';
import { emailExistenteValidator } from '../../shared/validators/emailExistente.validator';
import { EmailValidatorService } from '../../shared/services/email-validator.service';

export const senhasIguaisValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const senha = control.get('senha');
  const confirmaSenha = control.get('confirmaSenha');

  if (senha && confirmaSenha && senha.value !== confirmaSenha.value) {
    return { senhasDiferentes: true };
  }
  return null;
}

@Component({
  selector: 'app-dados-pessoais-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent
  ],
  templateUrl: './dados-pessoais-form.component.html',
  styleUrls: ['./dados-pessoais-form.component.scss']
})
export class DadosPessoaisFormComponent implements OnInit {
  dadosPessoaisForm!: FormGroup;
  estado$!: Observable<Estado[]>;
  cidade$!: Observable<Cidade[]>;

  carregandoCidades$ = new BehaviorSubject<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cadastroService: CadastroService,
    private IbgeService: IbgeService,
    private emailService: EmailValidatorService
  ) { }

  ngOnInit(): void {
    const formOptions: AbstractControlOptions = {
      validators: senhasIguaisValidator
    };

    this.dadosPessoaisForm = this.fb.group({
      nomeCompleto: ['', Validators.required],
      cpf: ['', [Validators.required, cpfValidator]],
      estado: ['', Validators.required],
      cidade: ['', Validators.required],
      email: ['', [Validators.required, Validators.email], emailExistenteValidator(this.emailService)],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmaSenha: ['', Validators.required]
    }, formOptions);

    this.carregarEstados();
    this.configurarListenerEstado();
  }

  onAnterior(): void {
    this.salvarDadosAtuais();
    this.router.navigate(['/cadastro/area-atuacao']);
  }

  onProximo(): void {
    if (this.dadosPessoaisForm.valid) {
      this.salvarDadosAtuais();
      this.router.navigate(['/cadastro/confirmacao']);
    } else {
      this.dadosPessoaisForm.markAllAsTouched();
    }
  }

  private salvarDadosAtuais() {
    const formValue = this.dadosPessoaisForm.value;
    this.cadastroService.updateCadastroData({
      nomeCompleto: formValue.nomeCompleto,
      cpf: formValue.cpf,
      estado: formValue.estado,
      cidade: formValue.cidade,
      email: formValue.email,
      senha: formValue.senha
    })
  }

  private carregarEstados(): void {
    this.estado$ = this.IbgeService.getEstados();
  }

  private configurarListenerEstado() {
    const estadoControl = this.dadosPessoaisForm.get('estado');
    if(estadoControl) {
      this.cidade$ = estadoControl.valueChanges.pipe(
        startWith(''),
        tap(() => {
          this.resetarCidade();
          this.carregandoCidades$.next(true);
        }),
        switchMap(uf => {
          if(uf) {
            return this.IbgeService.getCidadesPorEstado(uf).pipe(
              tap(() => this.carregandoCidades$.next(false))
            );
          }
          this.carregandoCidades$.next(false);
          return of([]);
        })
      );
    }
  }

  private resetarCidade() {
    this.dadosPessoaisForm.get('cidade')?.setValue('');
  }
}
