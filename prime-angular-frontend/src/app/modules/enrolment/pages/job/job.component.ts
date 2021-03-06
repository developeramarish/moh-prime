import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { Config } from '@config/config.model';
import { ConfigService } from '@config/config.service';
import { ToastService } from '@core/services/toast.service';
import { LoggerService } from '@core/services/logger.service';
import { UtilsService } from '@core/services/utils.service';
import { FormUtilsService } from '@core/services/form-utils.service';

import { Job } from '@enrolment/shared/models/job.model';
import { EnrolmentRoutes } from '@enrolment/enrolment.routes';
import { BaseEnrolmentProfilePage } from '@enrolment/shared/classes/BaseEnrolmentProfilePage';
import { EnrolmentService } from '@enrolment/shared/services/enrolment.service';
import { EnrolmentResource } from '@enrolment/shared/services/enrolment-resource.service';
import { EnrolmentFormStateService } from '@enrolment/shared/services/enrolment-form-state.service';

@Component({
  selector: 'app-job',
  templateUrl: './job.component.html',
  styleUrls: ['./job.component.scss']
})
export class JobComponent extends BaseEnrolmentProfilePage implements OnInit, OnDestroy {
  public jobNames: Config<number>[];
  public filteredJobNames: BehaviorSubject<Config<number>[]>;
  public allowDefaultOption: boolean;
  public defaultOptionLabel: string;

  constructor(
    protected route: ActivatedRoute,
    protected router: Router,
    protected dialog: MatDialog,
    protected enrolmentService: EnrolmentService,
    protected enrolmentResource: EnrolmentResource,
    protected enrolmentFormStateService: EnrolmentFormStateService,
    protected toastService: ToastService,
    protected logger: LoggerService,
    protected utilService: UtilsService,
    protected formUtilsService: FormUtilsService,
    private configService: ConfigService
  ) {
    super(
      route,
      router,
      dialog,
      enrolmentService,
      enrolmentResource,
      enrolmentFormStateService,
      toastService,
      logger,
      utilService,
      formUtilsService
    );

    this.jobNames = this.configService.jobNames;
    this.filteredJobNames = new BehaviorSubject<Config<number>[]>(this.jobNames);
    this.allowDefaultOption = false;
    this.defaultOptionLabel = 'None';
  }

  public get jobs(): FormArray {
    return this.form.get('jobs') as FormArray;
  }

  public addJob(value: string = '') {
    const defaultValue = (value)
      ? value : (this.allowDefaultOption)
        ? this.defaultOptionLabel : '';
    const job = this.enrolmentFormStateService.buildJobForm(defaultValue);
    this.jobs.push(job);
  }

  public removeJob(index: number) {
    this.jobs.removeAt(index);
  }

  public canDeactivate(): Observable<boolean> | boolean {
    const canDeactivate = super.canDeactivate();

    return (canDeactivate instanceof Observable)
      ? canDeactivate.pipe(tap((result: boolean) => this.removeIncompleteJobs(result)))
      : canDeactivate;
  }

  public ngOnInit() {
    this.createFormInstance();
    this.initForm();
  }

  public ngOnDestroy() {
    this.removeIncompleteJobs(true);
  }

  protected createFormInstance() {
    this.form = this.enrolmentFormStateService.jobsForm;
  }

  protected initForm() {
    // Initialize listeners before patching
    this.form.valueChanges
      .subscribe(({ jobs }: { jobs: Job[] }) => this.filterJobNames(jobs));

    this.patchForm();

    // Always have at least one job ready for
    // the enrollee to fill out
    if (!this.jobs.length) {
      this.addJob();
    }
  }

  protected onSubmitFormIsValid() {
    // Enrollees can not have jobs and certifications
    this.removeCollegeCertifications();
  }

  protected nextRouteAfterSubmit() {
    let nextRoutePath: string;
    if (!this.isProfileComplete) {
      nextRoutePath = EnrolmentRoutes.CARE_SETTING;
    }

    super.nextRouteAfterSubmit(nextRoutePath);
  }

  private filterJobNames(jobs: Job[]) {
    // All the currently chosen jobs
    const selectedJobNames = jobs.map((j: Job) => j.title);
    // Filter the list of possible jobs using the selected jobs
    const filteredJobNames = this.jobNames
      .filter((c: Config<number>) => !selectedJobNames.includes(c.name));

    this.filteredJobNames.next(filteredJobNames);
  }

  /**
   * @description
   * Removes incomplete jobs from the list in preparation
   * for submission, and allows for an empty list of jobs.
   */
  private removeIncompleteJobs(noEmptyJob: boolean = false) {
    this.jobs.controls
      .forEach((control: FormGroup, index: number) => {
        const value = control.get('title').value;

        // Remove when empty, default option, or group is invalid
        if (!value || value === this.defaultOptionLabel || control.invalid) {
          this.removeJob(index);
        }
      });

    // Always have a single job available, and it prevents
    // the page from jumping too much when routing
    if (!noEmptyJob && !this.jobs.controls.length) {
      this.addJob();
    }
  }

  /**
   * @description
   * Remove college certifications from the enrolment as enrollees can not have
   * job(s), as well as, college certification(s).
   */
  private removeCollegeCertifications() {
    const form = this.enrolmentFormStateService.regulatoryForm;
    const certifications = form.get('certifications') as FormArray;
    certifications.clear();
  }
}
