import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { Subscription, Observable } from 'rxjs';
import { map, tap, distinctUntilChanged, startWith } from 'rxjs/operators';

import { Config, VendorConfig } from '@config/config.model';
import { ConfigService } from '@config/config.service';
import { FormUtilsService } from '@core/services/form-utils.service';
import { OrganizationTypeEnum } from '@shared/enums/organization-type.enum';
import { ConfirmDialogComponent } from '@shared/components/dialogs/confirm-dialog/confirm-dialog.component';

import { SiteRoutes } from '@registration/site-registration.routes';
import { IForm } from '@registration/shared/interfaces/form.interface';
import { IPage } from '@registration/shared/interfaces/page.interface';
import { RouteUtils } from '@registration/shared/classes/route-utils.class';
import { SiteResource } from '@registration/shared/services/site-resource.service';
import { SiteService } from '@registration/shared/services/site.service';
import { SiteFormStateService } from '@registration/shared/services/site-form-state.service';

@Component({
  selector: 'app-care-setting',
  templateUrl: './care-setting.component.html',
  styleUrls: ['./care-setting.component.scss']
})
export class CareSettingComponent implements OnInit, IPage, IForm {
  public busy: Subscription;
  public form: FormGroup;
  public title: string;
  public routeUtils: RouteUtils;
  public organization: string;
  public doingBusinessAsNames: string[];
  public organizationTypeConfig: Config<number>[];
  public vendorConfig: VendorConfig[];
  public filteredVendorConfig$: Observable<VendorConfig[]>;
  public hasNoVendorError: boolean;
  public isCompleted: boolean;
  public SiteRoutes = SiteRoutes;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private siteService: SiteService,
    private siteResource: SiteResource,
    private siteFormStateService: SiteFormStateService,
    private formUtilsService: FormUtilsService,
    private dialog: MatDialog,
    private configService: ConfigService,
  ) {
    this.title = 'Care Setting';
    this.routeUtils = new RouteUtils(route, router, SiteRoutes.MODULE_PATH);
    this.organizationTypeConfig = this.configService.organizationTypes;
    this.vendorConfig = this.configService.vendors;
    this.hasNoVendorError = false;
  }

  public get organizationTypeCode(): FormControl {
    return this.form.get('organizationTypeCode') as FormControl;
  }

  public onSubmit() {
    // TODO structured to match in all organization views
    if (this.formUtilsService.checkValidity(this.form)) {
      const payload = this.siteFormStateService.json;
      this.siteResource
        .updateSite(payload)
        .subscribe(() => {
          this.form.markAsPristine();
          this.nextRoute();
        });
    }
  }

  public onBack() {
    this.routeUtils.routeTo([SiteRoutes.MODULE_PATH, SiteRoutes.SITE_MANAGEMENT]);
  }

  public nextRoute() {
    this.routeUtils.routeRelativeTo(SiteRoutes.BUSINESS_LICENCE);
  }

  public onVendorChange() {
    this.hasNoVendorError = false;
  }

  public disableOrganization(organizationTypeCode: number): boolean {
    return ![
      // Omit care setting types that are not:
      OrganizationTypeEnum.COMMUNITY_PRACTICE,
      OrganizationTypeEnum.COMMUNITY_PHARMACIST
    ].includes(organizationTypeCode);
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
    this.form = this.siteFormStateService.careSettingTypeForm;
  }

  private initForm() {
    this.filteredVendorConfig$ = this.organizationTypeCode.valueChanges
      .pipe(
        startWith(0),
        // pairwise(),
        distinctUntilChanged(),
        tap((value) => console.log(value)),
        map((organizationTypeCode: number) =>
          this.vendorConfig.filter(
            (vendorConfig: VendorConfig) =>
              vendorConfig.organizationTypeCode === organizationTypeCode
          )
        )
      );

    // TODO structured to match in all site views
    const site = this.siteService.site;
    this.isCompleted = site?.completed;
    this.siteFormStateService.setForm(site);
  }
}