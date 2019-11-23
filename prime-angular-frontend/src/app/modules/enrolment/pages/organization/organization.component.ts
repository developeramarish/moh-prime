import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormArray, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';

import { Observable, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

import { Config } from '@config/config.model';
import { ConfigService } from '@config/config.service';
import { ToastService } from '@core/services/toast.service';
import { LoggerService } from '@core/services/logger.service';
import { ConfirmDialogComponent } from '@shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { EnrolmentStateService } from '@enrolment/shared/services/enrolment-state.service';
import { EnrolmentRoutes } from '@enrolment/enrolment.routes';
import { EnrolmentResource } from '@enrolment/shared/services/enrolment-resource.service';
import { EnrolmentService } from '@enrolment/shared/services/enrolment.service';
import { Organization } from '@enrolment/shared/models/organization.model';

@Component({
  selector: 'app-organization',
  templateUrl: './organization.component.html',
  styleUrls: ['./organization.component.scss']
})
export class OrganizationComponent implements OnInit, OnDestroy {
  public busy: Subscription;
  public form: FormGroup;
  public organizationCtrl: FormControl;
  public organizationTypes: Config<number>[];
  public filteredOrganizationTypes: Config<number>[];
  public EnrolmentRoutes = EnrolmentRoutes;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private configService: ConfigService,
    private enrolmentStateService: EnrolmentStateService,
    private enrolmentResource: EnrolmentResource,
    private enrolmentService: EnrolmentService,
    private toastService: ToastService,
    private logger: LoggerService
  ) {
    this.organizationTypes = this.configService.organizationTypes;
  }

  public get organizations(): FormArray {
    return this.form.get('organizations') as FormArray;
  }

  public onSubmit() {
    if (this.form.valid) {
      const payload = this.enrolmentStateService.enrolment;
      this.busy = this.enrolmentResource.updateEnrolment(payload)
        .subscribe(
          () => {
            this.form.markAsPristine();
            this.toastService.openSuccessToast('PharmaNet access has been saved');
            this.router.navigate([EnrolmentRoutes.REVIEW], { relativeTo: this.route.parent });
          },
          (error: any) => {
            this.toastService.openErrorToast('PharmaNet access could not be saved');
            this.logger.error('[Enrolment] Organization::onSubmit error has occurred: ', error);
          });
    } else {
      this.form.markAllAsTouched();
    }
  }

  public addOrganization() {
    const organization = this.enrolmentStateService.buildOrganizationForm();
    this.organizations.push(organization);
  }

  public disableOrganization(organizationTypeCode: number): boolean {
    // Omit organizations types that are not "Community Practices" for ComPap
    return (organizationTypeCode !== 1);
  }

  public removeOrganization(index: number) {
    this.organizations.removeAt(index);
  }

  public filterOrganizationTypes(organization: FormGroup) {
    // Create a list of filtered organization types
    if (this.organizations.length) {
      // All the currently chosen organizations
      const selectedOrganizationTypeCodes = this.organizations.value
        .map((o: Organization) => o.organizationTypeCode);
      // Current organization type selected
      const currentOrganization = this.organizationTypes
        .find(o => o.code === organization.get('organizationTypeCode').value);
      // Filter the list of possible organizations using the selected organizations
      const filteredOrganizationTypes = this.organizationTypes
        .filter((c: Config<number>) => !selectedOrganizationTypeCodes.includes(c.code));

      if (currentOrganization) {
        // Add the current organization to the list of filtered
        // organizations so it remains visible
        filteredOrganizationTypes.unshift(currentOrganization);
      }

      return filteredOrganizationTypes;
    }

    // Otherwise, provide the entire list of organization types
    return this.organizationTypes;
  }

  public canDeactivate(): Observable<boolean> | boolean {
    const data = 'unsaved';
    return (this.form.dirty)
      ? this.dialog.open(ConfirmDialogComponent, { data }).afterClosed()
        .pipe(
          tap(() => this.removeIncompleteOrganizations())
        )
      : true;
  }

  public ngOnInit() {
    this.createFormInstance();
    // Initialize form changes before patching
    this.initForm();
  }

  public ngOnDestroy() {
    this.removeIncompleteOrganizations();
  }

  private createFormInstance() {
    this.form = this.enrolmentStateService.organizationForm;
  }

  private initForm() {
    this.enrolmentStateService.enrolment = this.enrolmentService.enrolment;

    // Always have at least one organization ready for
    // the enrollee to fill out
    if (!this.organizations.length) {
      this.addOrganization();
    }
  }

  private removeIncompleteOrganizations() {
    this.organizations.controls
      .forEach((control: FormGroup, index: number) => {
        const value = control.get('organizationTypeCode').value;

        // Remove if organization is empty or the group is invalid
        if (!value || control.invalid) {
          this.removeOrganization(index);
        }
      });

    // Always have a single organization available, and it prevents
    // the page from jumping too much when routing
    if (!this.organizations.controls.length) {
      this.addOrganization();
    }
  }
}