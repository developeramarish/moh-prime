import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { debounceTime } from 'rxjs/operators';

import { Config } from '@config/config.model';
import { ConfigService } from '@config/config.service';
import { EnrolmentStatus } from '@shared/enums/enrolment-status.enum';

// TODO directly alter the URL with query params for other components to listen to changes
// instead of emitting the changes up and then altering the query params
@Component({
  selector: 'app-search-form',
  templateUrl: './search-form.component.html',
  styleUrls: ['./search-form.component.scss']
})
export class SearchFormComponent implements OnInit {
  @Input() public disabled: boolean;
  @Input() public statuses: Config<number>[];
  @Output() public search: EventEmitter<string>;
  @Output() public filter: EventEmitter<EnrolmentStatus>;
  @Output() public refresh: EventEmitter<void>;

  public form: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.search = new EventEmitter<string>();
    this.filter = new EventEmitter<EnrolmentStatus>();
    this.refresh = new EventEmitter<void>();
  }

  public get textSearch(): FormControl {
    return this.form.get('textSearch') as FormControl;
  }

  public get statusCode(): FormControl {
    return this.form.get('statusCode') as FormControl;
  }

  public onRefresh() {
    this.refresh.emit();
  }

  public ngOnInit() {
    this.createFormInstance();
    this.initForm();
  }

  private createFormInstance() {
    this.form = this.fb.group({
      textSearch: [{ value: null, disabled: this.disabled }, []],
      statusCode: [{ value: '', disabled: this.disabled }, []]
    });
  }

  private initForm() {
    const queryParams = this.route.snapshot.queryParams;
    this.form.patchValue(queryParams);

    this.textSearch.valueChanges
      .pipe(debounceTime(500))
      // Passing `null` removes the query parameter from the URL
      .subscribe((search: string) => this.search.emit(search || null));

    this.statusCode.valueChanges
      .pipe(debounceTime(500))
      // Passing `null` removes the query parameter from the URL
      .subscribe((status: number) => {
        const value = (status || status === 0) ? status : null;
        this.filter.emit(value);
      });
  }
}
