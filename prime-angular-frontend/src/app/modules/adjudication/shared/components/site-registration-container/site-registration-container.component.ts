import { Component, OnInit, Input, Output, TemplateRef, EventEmitter, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';

import { Subscription, Observable, EMPTY, of, noop } from 'rxjs';
import { exhaustMap, map } from 'rxjs/operators';

import { MatTableDataSourceUtils } from '@lib/modules/ngx-material/mat-table-data-source-utils.class';

import { OrganizationResource } from '@core/resources/organization-resource.service';
import { SiteResource } from '@core/resources/site-resource.service';
import { DIALOG_DEFAULT_OPTION } from '@shared/components/dialogs/dialogs-properties.provider';
import { DialogDefaultOptions } from '@shared/components/dialogs/dialog-default-options.model';
import { ConfirmDialogComponent } from '@shared/components/dialogs/confirm-dialog/confirm-dialog.component';

import { AuthService } from '@auth/shared/services/auth.service';
import { RouteUtils } from '@registration/shared/classes/route-utils.class';
import { Site } from '@registration/shared/models/site.model';
import { AdjudicationRoutes } from '@adjudication/adjudication.routes';
import { Organization } from '@registration/shared/models/organization.model';

@Component({
  selector: 'app-site-registration-container',
  templateUrl: './site-registration-container.component.html',
  styleUrls: ['./site-registration-container.component.scss']
})
export class SiteRegistrationContainerComponent implements OnInit {
  @Input() public hasActions: boolean;
  @Input() public content: TemplateRef<any>;
  @Input() public refresh: Observable<boolean>;
  @Output() public action: EventEmitter<void>;

  public busy: Subscription;
  public columns: string[];
  public dataSource: MatTableDataSource<Site>;

  public showSearchFilter: boolean;
  public AdjudicationRoutes = AdjudicationRoutes;

  private routeUtils: RouteUtils;

  constructor(
    @Inject(DIALOG_DEFAULT_OPTION) private defaultOptions: DialogDefaultOptions,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private organizationResource: OrganizationResource,
    private siteResource: SiteResource,
    private dialog: MatDialog
  ) {
    this.routeUtils = new RouteUtils(route, router, AdjudicationRoutes.routePath(AdjudicationRoutes.SITE_REGISTRATIONS));

    this.action = new EventEmitter<void>();

    this.hasActions = false;
    this.dataSource = new MatTableDataSource<Site>([]);
  }

  public onSearch(search: string | null): void {
    this.routeUtils.updateQueryParams({ search });
  }

  public onFilter(status: any | null): void {
    this.routeUtils.updateQueryParams({ status });
  }

  public onRefresh(): void {
    this.getDataset(this.route.snapshot.queryParams);
  }

  public onRoute(routePath: string | (string | number)[]) {
    this.routeUtils.routeWithin(routePath);
  }

  public onDelete(record: { [key: string]: number }) {
    (record.organizationId)
      ? this.deleteOrganization(record?.organizationId)
      : this.deleteSite(record?.siteId);
  }

  public ngOnInit(): void {
    // Use existing query params for initial search
    this.getDataset(this.route.snapshot.queryParams);

    // Update results on query param change
    this.route.queryParams
      .subscribe((queryParams: { [key: string]: any }) => this.getDataset(queryParams));

    // Listen for requests to refresh the data layer
    if (this.refresh instanceof Observable) {
      this.refresh.subscribe((shouldRefresh: boolean) => {
        if (shouldRefresh) {
          this.onRefresh();
        }
      });
    }
  }

  // private getDataset(queryParams: { search?: string, status?: number }): void {
  //   const organizationId = this.route.snapshot.params.id;
  //   const results$ = (organizationId)
  //     ? this.getOrganizationById(organizationId)
  //     : this.getOrganizations(queryParams);

  //   this.busy = results$
  //     .pipe(
  //       map((organizations: Organization[]) => {
  //         organizations.map((organization: Organization) => {

  //         });
  //       })
  //     )
  //     .subscribe((organizations: Organization[]) => this.dataSource.data = organizations);
  // }

  // private getOrganizations({ search, status }: { search?: string, status?: number }): Observable<Organization[]> {
  //   return this.organizationResource.getOrganizations();
  // }

  // private getOrganizationById(organizationId: number): Observable<Organization[]> {
  //   return this.organizationResource
  //     .getOrganizationById(organizationId)
  //     .pipe(
  //       map((organization: Organization) => [organization])
  //     );
  // }

  private getDataset(queryParams: { search?: string, status?: number }): void {
    const siteId = this.route.snapshot.params.sid;
    const results$ = (siteId)
      ? this.getSiteById(siteId)
      : this.getSites(queryParams);

    this.busy = results$
      .subscribe((sites: Site[]) => this.dataSource.data = sites);
  }

  private getSites({ search, status }: { search?: string, status?: number }): Observable<Site[]> {
    return this.siteResource.getAllSites();
  }

  private getSiteById(siteId: number): Observable<Site[]> {
    return this.siteResource
      .getSiteById(siteId)
      .pipe(
        map((site: Site) => [site])
      );
  }

  // TODO compress these down into a single method using params
  private deleteOrganization(organizationId: number) {
    if (!organizationId) {
      return;
    }

    if (this.authService.isSuperAdmin()) {
      const data = this.defaultOptions.delete('organization');
      this.busy = this.dialog.open(ConfirmDialogComponent, { data })
        .afterClosed()
        .pipe(
          exhaustMap((result: boolean) =>
            (result)
              ? of(noop)
              : EMPTY
          ),
          exhaustMap(() => this.organizationResource.deleteOrganization(organizationId)),
        )
        .subscribe(() => this.routeUtils.routeRelativeTo(['../']));
    }
  }

  private deleteSite(siteId: number) {
    if (!siteId) {
      return;
    }

    if (this.authService.isSuperAdmin()) {
      const data = this.defaultOptions.delete('site');
      this.busy = this.dialog.open(ConfirmDialogComponent, { data })
        .afterClosed()
        .pipe(
          exhaustMap((result: boolean) =>
            (result)
              ? of(noop)
              : EMPTY
          ),
          exhaustMap(() => this.siteResource.deleteSite(siteId)),
          map((site: Site) => this.dataSource.data = MatTableDataSourceUtils.delete<Site>(this.dataSource, 'id', site.id))
        )
        .subscribe(() => this.routeUtils.routeRelativeTo(['../']));
    }
  }
}
