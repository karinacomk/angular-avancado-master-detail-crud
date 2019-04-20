import { switchMap } from 'rxjs/operators';
import { OnInit, AfterContentChecked, Injector } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import toastr from 'toastr';
import { BaseResourceModel } from '../../models/base-resource.model';
import { BaseResourceService } from '../../services/base-resource.service';

export abstract class BaseResourceFormComponent<T extends BaseResourceModel> implements OnInit, AfterContentChecked {

  currentAction: string;
  resourceForm: FormGroup;
  pageTitle: string;
  serverErrorMessages: string[] = null;
  submittingForm: boolean = false;

  protected route: ActivatedRoute;
  protected router: Router;
  protected formBuilder: FormBuilder;

  constructor(
    protected injector: Injector, // só a filha pode chamar
    public resource: T,// new Category() - a filha pode chamar e todo mundo tbm
    protected resourceService: BaseResourceService<T>, // se private a filha nao pode chamar
    protected jsonDataToResourceFn: (jsonData) => T
  ) { 
      this.route = injector.get(ActivatedRoute);
      this.router = injector.get(Router);
      this.formBuilder = injector.get(FormBuilder);
  }

  ngOnInit() {
    this.setCurrentAction();
    this.buildResourceForm();
    this.loadResource();
  }

  ngAfterContentChecked(): void {
    this.setPageTitle();
  }

  submitForm() {
    this.submittingForm = true;

    if (this.currentAction === 'new') {
      this.createResource();
    } else {
      this.updateResource();
    }
  }

  // metodos privados
  protected setCurrentAction() {
    if (this.route.snapshot.url[0].path === 'new') {
      this.currentAction = 'new';
    } else {
      this.currentAction = 'edit';
    }
  }

  protected loadResource() {
    if (this.currentAction === 'edit') {
      this.route.paramMap.pipe(
        switchMap(params => this.resourceService.getById(+params.get('id')))
      )
      .subscribe(
        (resource) => {
          this.resource = resource;
          this.resourceForm.patchValue(resource); // binds loaded category data to CategoryForm
        },
        (error) => alert('Ocorreu um erro no servidor, tente mais tarde.')
      );
    }
  }

  protected setPageTitle() {
    if (this.currentAction === 'new') {
      this.pageTitle = this.creationPageTitle();
    } else {
      this.pageTitle = this.editionPageTitle();
    }
  }

  protected creationPageTitle(): string {
    return "Novo";
  }

  protected editionPageTitle(): string {
    return "Edição";
  }

  protected createResource() {
    // atribuindo ao objeto novo tudo o q há no formulario
    const resource: T = this.jsonDataToResourceFn(this.resourceForm.value);

    this.resourceService.create(resource)
    .subscribe(
      resource => this.actionsForSuccess(resource),
      error => this.actionsForError(error)
    );
  }

  protected updateResource() {
    // atribuindo ao objeto novo tudo o q há no formulario
    const resource: T = this.jsonDataToResourceFn(this.resourceForm.value);

    this.resourceService.update(resource)
    .subscribe(
      resource => this.actionsForSuccess(resource),
      error => this.actionsForError(error)
    );
  }

  protected actionsForSuccess(resource: T) {
    toastr.success('Solicitação processada com sucesso!');

    const baseComponentPath: string = this.route.snapshot.parent.url[0].path;

    // redirect/reaload component page
    this.router.navigateByUrl(baseComponentPath, { skipLocationChange: true }).then( // nao guarda no historico do browser
      () => this.router.navigate([baseComponentPath, resource.id, 'edit'])
    );
  }

  protected actionsForError(error) {
    toastr.error('Ocorreu um erro ao processar a sua solicitação!');

    this.submittingForm = false;

    if (error === 422) { // comunicou, mas nao conseguiu gravar por algum motivo
      this.serverErrorMessages = JSON.parse(error._body).errors;
      // email nao pode ficar vazio, por ex.
    } else { // nao comunicou
      this.serverErrorMessages = ['Falha na comunicação com o servidor. Por favor, tente mais tarde.'];
    }
  }

  protected abstract buildResourceForm(): void;
}
