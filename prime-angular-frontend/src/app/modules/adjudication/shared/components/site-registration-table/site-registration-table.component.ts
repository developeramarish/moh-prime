import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

import { AuthService } from '@auth/shared/services/auth.service';
import { AdjudicationRoutes } from '@adjudication/adjudication.routes';
import { SiteRegistrationListViewModel } from '@registration/shared/models/site-registration.model';
import { SiteStatusType } from '@registration/shared/enum/site-status.enum';
import { CareSettingEnum } from '@shared/enums/care-setting.enum';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-site-registration-table',
  templateUrl: './site-registration-table.component.html',
  styleUrls: ['./site-registration-table.component.scss']
})
export class SiteRegistrationTableComponent implements OnInit {
  @Input() public dataSource: MatTableDataSource<SiteRegistrationListViewModel>;
  @Output() public claim: EventEmitter<number>;
  @Output() public disclaim: EventEmitter<number>;
  @Output() public route: EventEmitter<string | (string | number)[]>;

  public columns: string[];

  public SiteStatusType = SiteStatusType;
  public CareSettingEnum = CareSettingEnum;
  public AdjudicationRoutes = AdjudicationRoutes;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authService: AuthService
  ) {
    this.columns = [
      'displayId',
      'organizationName',
      'signingAuthority',
      'siteDoingBusinessAs',
      'submissionDate',
      'adjudicator',
      'siteAdjudication',
      'siteId',
      'remoteUsers',
      'careSetting',
      'actions'
    ];
    this.claim = new EventEmitter<number>();
    this.disclaim = new EventEmitter<number>();
    this.route = new EventEmitter<string | (string | number)[]>();
  }

  public get canEdit(): boolean {
    return this.authService.isAdmin();
  }

  public onClaim(siteId: number): void {
    this.claim.emit(siteId);
  }

  public onDisclaim(siteId: number): void {
    this.disclaim.emit(siteId);
  }

  public onRoute(routePath: string | (string | number)[]) {
    this.route.emit(routePath);
  }

  // TODO status lookup for sites would remove the need for this method and only require pipes
  public displayStatus(status: SiteStatusType) {
    return (status === SiteStatusType.APPROVED)
      ? 'Approved'
      : (status === SiteStatusType.DECLINED)
        ? 'Declined'
        : 'Under Review';
  }

  public remoteUsers(siteRegistration: SiteRegistrationListViewModel): number | 'Yes' | 'No' | 'N/A' {
    const count = siteRegistration.remoteUserCount;

    return (siteRegistration.careSettingCode !== CareSettingEnum.COMMUNITY_PHARMACIST)
      ? (!this.activatedRoute.snapshot.params.sid)
        ? (count) ? 'Yes' : 'No'
        : count
      : 'N/A';
  }

  public ngOnInit(): void { }
}
