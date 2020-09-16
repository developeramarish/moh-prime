import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

import { BehaviorSubject } from 'rxjs';

import { ConfirmDialogComponent } from '@shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { Admin } from '@auth/shared/models/admin.model';
import { AdjudicationResource } from '@adjudication/shared/services/adjudication-resource.service';

export enum ClaimActionEnum {
  Disclaim = 0,
  Claim = 1
}

export class ClaimEnrolleeAction {
  public action: ClaimActionEnum;
  public adjudicatorId?: number;
}

@Component({
  selector: 'app-claim-enrollee',
  templateUrl: './claim-enrollee.component.html',
  styleUrls: ['./claim-enrollee.component.scss']
})
export class ClaimEnrolleeComponent implements OnInit {
  public adjudicators$: BehaviorSubject<Admin[]>;

  constructor(
    private adjudicationResource: AdjudicationResource,
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
  ) {
    this.adjudicators$ = new BehaviorSubject<Admin[]>([]);
  }

  public onDisclaim(): void {
    const output = new ClaimEnrolleeAction();
    output.action = ClaimActionEnum.Disclaim;
    this.dialogRef.close({ output });
  }

  public onClaim(adminId: number): void {
    const output = new ClaimEnrolleeAction();
    output.action = ClaimActionEnum.Claim;
    output.adjudicatorId = adminId;
    this.dialogRef.close({ output });
  }

  public ngOnInit() {
    this.getAdjudicators();
  }

  private getAdjudicators() {
    this.adjudicationResource.getAdjudicators()
      .subscribe((adjudicators: Admin[]) => this.adjudicators$.next(adjudicators));
  }
}
