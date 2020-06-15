import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';

import { Subscription, Observable } from 'rxjs';
import { debounceTime, switchMap, map, tap } from 'rxjs/operators';

import { FormUtilsService } from '@core/services/form-utils.service';
import { UtilsService, SortWeight } from '@core/services/utils.service';
import { ConfirmDialogComponent } from '@shared/components/dialogs/confirm-dialog/confirm-dialog.component';

import { SiteRoutes } from '@registration/site-registration.routes';
import { RouteUtils } from '@registration/shared/classes/route-utils.class';
import { IPage } from '@registration/shared/interfaces/page.interface';
import { IForm } from '@registration/shared/interfaces/form.interface';
import { Organization } from '@registration/shared/models/organization.model';
import { OrganizationResource } from '@registration/shared/services/organization-resource.service';
import { OrganizationFormStateService } from '@registration/shared/services/organization-form-state.service';
import { OrganizationService } from '@registration/shared/services/organization.service';
import {
  OrgBookResource, OrgBookAutocompleteResult, OrgBookFacetHttpResponse, OrgBookDetailHttpResponse, OrgBookRelatedHttpResponse
} from '@registration/shared/services/org-book-resource.service';
import { compare, Operation } from 'fast-json-patch';

@Component({
  selector: 'app-organization-information',
  templateUrl: './organization-information.component.html',
  styleUrls: ['./organization-information.component.scss']
})
export class OrganizationInformationComponent implements OnInit, IPage, IForm {
  public busy: Subscription;
  public form: FormGroup;
  public initialOrg: Organization;
  public title: string;
  public routeUtils: RouteUtils;
  public organizations: string[];
  public doingBusinessAsNames: string[];
  public isCompleted: boolean;
  public SiteRoutes = SiteRoutes;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private organizationService: OrganizationService,
    private organizationResource: OrganizationResource,
    private organizationFormStateService: OrganizationFormStateService,
    private orgBookResource: OrgBookResource,
    private formUtilsService: FormUtilsService,
    private utilsService: UtilsService,
    private dialog: MatDialog
  ) {
    this.title = 'Organization Information';
    this.routeUtils = new RouteUtils(route, router, SiteRoutes.MODULE_PATH);
  }

  public get name(): FormControl {
    return this.form.get('name') as FormControl;
  }

  public get orgId(): FormControl {
    return this.form.get('orgId') as FormControl;
  }

  public get doingBusinessAs(): FormControl {
    return this.form.get('doingBusinessAs') as FormControl;
  }

  public onSubmit() {
    // TODO structured to match in all organization views
    if (this.formUtilsService.checkValidity(this.form)) {
      // TODO when spoking don't update
      const organization = this.organizationService.organization;

      const updateOrg = {
        ...this.form.value
      } as Organization;

      const jsonPatch = compare(this.initialOrg, updateOrg);
      console.log('jsonPatch: ', jsonPatch);

      this.organizationResource
        .patchOrganization(organization, jsonPatch)
        .subscribe(() => {
          this.form.markAsPristine();
          this.nextRoute();
        });
    }
  }

  public onSelect({ option }: MatAutocompleteSelectedEvent) {
    const orgName = option.value;
    this.orgBookResource.getOrganizationFacet(orgName)
      .pipe(
        this.orgBookResource.sourceIdMap(),
        // Perform a side effect
        tap((sourceId: string) => this.form.get('registrationId').patchValue(sourceId)),
        this.orgBookResource.doingBusinessAsMap()
      )
      .subscribe((doingBusinessAsNames: string[]) =>
        this.doingBusinessAsNames = doingBusinessAsNames
      );
  }

  public onBack() {
    this.routeUtils.routeRelativeTo(SiteRoutes.ORGANIZATION_SIGNING_AUTHORITY);
  }

  public nextRoute() {
    if (this.isCompleted) {
      this.routeUtils.routeRelativeTo(SiteRoutes.ORGANIZATION_REVIEW);
    } else {
      this.routeUtils.routeRelativeTo(SiteRoutes.ORGANIZATION_TYPE);
    }
  }

  public canDeactivate(): Observable<boolean> | boolean {
    const data = 'unsaved';
    return (this.form.dirty)
      ? this.dialog.open(ConfirmDialogComponent, { data }).afterClosed()
      : true;
  }

  public ngOnInit() {
    this.createFormInstance();
    this.initForm();
  }

  private createFormInstance() {
    this.form = this.organizationFormStateService.organizationInformationForm;
  }

  private initForm() {
    // TODO structured to match in all site views
    const organization = this.organizationService.organization;
    this.isCompleted = organization?.completed;
    this.organizationFormStateService.setForm(organization);

    this.name.valueChanges
      .pipe(
        debounceTime(400),
        switchMap((value: string) => this.orgBookResource.autocomplete(value))
      )
      .subscribe((organizations: OrgBookAutocompleteResult[]) => {
        // Assumed only a single name per organization is relavent
        this.organizations = organizations.map(o => o.names[0].text);
      });

    this.initialOrg = {
      ...this.form.value
    } as Organization;
  }

  /**
   * @description
   * Sort by day of the week.
   */
  private sortDoingBusinessAsNames(): (a: string, b: string) => SortWeight {
    return (a: string, b: string) =>
      this.utilsService.sort<string>(a, b);
  }
}
