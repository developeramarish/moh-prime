import { Component, OnInit } from '@angular/core';

import { AbstractCollectionNoticeAlert } from '@shared/components/collection-notice-container/collection-notice-container.component';

@Component({
  selector: 'app-enrolment-collection-notice',
  templateUrl: './enrolment-collection-notice.component.html',
  styleUrls: ['./enrolment-collection-notice.component.scss']
})
export class EnrolmentCollectionNoticeComponent extends AbstractCollectionNoticeAlert implements OnInit {
  constructor() {
    super();
  }

  public onAccept() {
    this.accepted.emit();
  }

  public ngOnInit(): void { }
}
