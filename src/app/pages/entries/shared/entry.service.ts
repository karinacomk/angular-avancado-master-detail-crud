import { Entry } from './entry.model';
import { Injectable, Injector } from '@angular/core';
import { CategoryService } from '../../categories/shared/category.service';
import { BaseResourceService } from 'src/app/shared/services/base-resource.service';
import { flatMap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EntryService extends BaseResourceService<Entry> {

  constructor(protected injector: Injector, private categoryService: CategoryService) {
    super("api/entries", injector);
  }

  create(entry: Entry): Observable<Entry> {
    return this.categoryService.getById(entry.categoryId).pipe(
      //só precisa fazer isso por causa do memory do angular
      //flatmap isso aqui é rxjs nem é angular
      flatMap(category => {
        entry.category = category;

        return super.create(entry);
      })
    )    
  }

  update(entry: Entry): Observable<Entry> {
    return this.categoryService.getById(entry.categoryId).pipe(
      //só precisa fazer isso por causa do memory do angular
      //flatmap isso aqui é rxjs nem é angular
      flatMap(category => {
        entry.category = category;

        return super.update(entry);
      })
    )    
  }

  protected jsonDataToResources(jsonData: any[]): Entry[] {
    console.log(jsonData[0] as Entry);//cast
    console.log(Object.assign(new Entry(), jsonData));

    const entries: Entry[] = [];

    //jsonData.forEach(element => entries.push(element as Entry));
    jsonData.forEach(element => {
      const entry = Object.assign(new Entry(), element);//criando um objeto entry preenchido com os dados do servidor

      entries.push(entry);
    });

    return entries;
  }

  protected jsonDataToResource(jsonData: any): Entry {
    return Object.assign(new Entry(), jsonData);
  }
}
