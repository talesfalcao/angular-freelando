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
import { FormConfig } from '../../shared/models/form-config.interface';
import { DynamicFormService } from '../../shared/services/dynamic-form.service';
import { getDadosPessoaisConfig } from '../../config/dados-pessoais-form.config';
import { FormFieldBase } from '../../shared/models/form-field-base.interface';

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
  formConfig!: FormConfig;

  estado$!: Observable<Estado[]>;
  cidade$!: Observable<Cidade[]>;

  carregandoCidades$ = new BehaviorSubject<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cadastroService: CadastroService,
    private IbgeService: IbgeService,
    private emailService: EmailValidatorService,
    private dynamicFormService: DynamicFormService
  ) {
    this.dynamicFormService.registerFormConfig('dadosPessoaisForm', getDadosPessoaisConfig);
  }

  ngOnInit(): void {
    this.formConfig = this.dynamicFormService.getFormConfig("dadosPessoaisForm");

    this.dadosPessoaisForm = this.dynamicFormService.createFormGroup(this.formConfig, { validators: senhasIguaisValidator })

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

  isFieldType(field: FormFieldBase, type: string): boolean {
    return field.type == type;
  }

  hasField(name: string): boolean {
    return this.formConfig.fields.some(field => field.formControlName === name);
  }

  getFieldByName(name: string): FormFieldBase {
    return this.formConfig.fields.find(field => field.formControlName === name) || {} as FormFieldBase;
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
