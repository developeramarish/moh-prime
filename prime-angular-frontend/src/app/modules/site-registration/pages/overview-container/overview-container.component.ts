import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { Subscription, EMPTY } from 'rxjs';
import { exhaustMap } from 'rxjs/operators';

import { SiteResource } from '@core/resources/site-resource.service';
import { OrganizationResource } from '@core/resources/organization-resource.service';
import { UtilsService } from '@core/services/utils.service';
import { AbstractComponent } from '@shared/classes/abstract-component';
import { ConfirmDialogComponent } from '@shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { DialogOptions } from '@shared/components/dialogs/dialog-options.model';

import { Site } from '@registration/shared/models/site.model';
import { Organization } from '@registration/shared/models/organization.model';
import { SiteRoutes } from '@registration/site-registration.routes';
import { RouteUtils } from '@registration/shared/classes/route-utils.class';
import { SiteService } from '@registration/shared/services/site.service';

@Component({
  selector: 'app-overview-container',
  templateUrl: './overview-container.component.html',
  styleUrls: ['./overview-container.component.scss']
})
export class OverviewContainerComponent extends AbstractComponent implements OnInit {
  public busy: Subscription;
  public site: Site;
  public organization: Organization;
  public hasActions: boolean;
  @Input() public test: string;
  public routeUtils: RouteUtils;
  public SiteRoutes = SiteRoutes;

  constructor(
    protected route: ActivatedRoute,
    protected router: Router,
    private siteResource: SiteResource,
    private organizationResource: OrganizationResource,
    private utilsService: UtilsService,
    private dialog: MatDialog,
    private siteService: SiteService,
  ) {
    super(route, router);
    this.routeUtils = new RouteUtils(route, router, SiteRoutes.MODULE_PATH);
  }

  public onRoute(routePath: string) {
    this.routeUtils.routeRelativeTo(routePath);
  }

  public getBusinessLicence() {
    this.siteResource.getBusinessLicenceDownloadToken(this.site.id)
      .subscribe((token: string) => {
        this.utilsService.downloadToken(token);
      });
  }

  public onSubmit() {
    const payload = this.siteService.site;
    const data: DialogOptions = {
      title: 'Save Site',
      message: 'When your site is saved it will be submitted for review. Are you ready to save your site?',
      actionText: 'Save Site'
    };
    this.busy = this.dialog.open(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(
        exhaustMap((result: boolean) =>
          (result)
            ? this.siteResource.submitSite(payload)
            : EMPTY
        )
      )
      .subscribe(() => this.nextRoute());
  }

  public onBack() { }

  public nextRoute() {
    this.routeUtils.routeTo([SiteRoutes.MODULE_PATH, SiteRoutes.SITE_MANAGEMENT], {
      queryParams: { submitted: true }
    });
  }

  ngOnInit(): void {
    if (this.route.snapshot.params.oid) {
      this.getOrganization(this.route.snapshot.params.oid);
    }

    if (this.route.snapshot.params.sid) {
      this.getSite(this.route.snapshot.params.sid);
    }
  }

  private getSite(siteId: number): void {
    this.busy = this.siteResource.getSiteById(siteId)
      .subscribe((site: Site) => this.site = site);
  }

  private getOrganization(organizationId: number): void {
    this.busy = this.organizationResource.getOrganizationById(organizationId)
      .subscribe((organization: Organization) => this.organization = organization);
  }

}
