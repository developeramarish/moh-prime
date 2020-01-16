import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { MockEnrolmentService } from 'test/mocks/mock-enrolment.service';
import { MockConfigService } from 'test/mocks/mock-config.service';

import { ClipboardModule } from 'ngx-clipboard';

import { PharmanetEnrolmentCertificateComponent } from './pharmanet-enrolment-certificate.component';
import { APP_CONFIG, APP_DI_CONFIG } from 'app/app-config.module';
import { ConfigCodePipe } from '@config/config-code.pipe';
import { ConfigService } from '@config/config.service';
import { NgxBusyModule } from '@shared/modules/ngx-busy/ngx-busy.module';
import { NgxContextualHelpModule } from '@shared/modules/ngx-contextual-help/ngx-contextual-help.module';
import { NgxMaterialModule } from '@shared/modules/ngx-material/ngx-material.module';
import { EnrolmentPipe } from '@shared/pipes/enrolment.pipe';
import { FormatDatePipe } from '@shared/pipes/format-date.pipe';
import { PostalPipe } from '@shared/pipes/postal.pipe';
import { YesNoPipe } from '@shared/pipes/yes-no.pipe';
import { DefaultPipe } from '@shared/pipes/default.pipe';
import { PageComponent } from '@shared/components/page/page.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { PageSubheaderComponent } from '@shared/components/page-subheader/page-subheader.component';
import { ClipboardIconComponent } from '@shared/components/clipboard-icon/clipboard-icon.component';
import { ProgressIndicatorComponent } from '@shared/components/progress-indicator/progress-indicator.component';
import { EnrolleeAddressComponent } from '@shared/components/enrollee/enrollee-address/enrollee-address.component';
import { EnrolleeProfileComponent } from '@shared/components/enrollee/enrollee-profile/enrollee-profile.component';
import { EnrolleePrivilegesComponent } from '@shared/components/enrollee/enrollee-privileges/enrollee-privileges.component';
import { EnrolleePropertyComponent } from '@shared/components/enrollee/enrollee-property/enrollee-property.component';
import { EnrolleePipe } from '@shared/pipes/enrollee.pipe';
import { EnrolmentService } from '@enrolment/shared/services/enrolment.service';
import { EnrolleeOrganizationsComponent } from '@shared/components/enrollee/enrollee-organizations/enrollee-organizations.component';
import { OrganizationComponent } from '../organization/organization.component';
import { FormIconGroupComponent } from '@shared/components/form-icon-group/form-icon-group.component';
import { PageFooterComponent } from '@enrolment/shared/components/page-footer/page-footer.component';

describe('PharmanetEnrolmentCertificateComponent', () => {
  let component: PharmanetEnrolmentCertificateComponent;
  let fixture: ComponentFixture<PharmanetEnrolmentCertificateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(
      {
        imports: [
          HttpClientTestingModule,
          NgxBusyModule,
          NgxContextualHelpModule,
          NgxMaterialModule,
          ReactiveFormsModule,
          RouterTestingModule,
          ClipboardModule
        ],
        declarations: [
          PharmanetEnrolmentCertificateComponent,
          PageComponent,
          PageHeaderComponent,
          PageFooterComponent,
          PageSubheaderComponent,
          EnrolleeProfileComponent,
          EnrolleeAddressComponent,
          EnrolleePrivilegesComponent,
          EnrolleeOrganizationsComponent,
          EnrolleePropertyComponent,
          ClipboardIconComponent,
          ProgressIndicatorComponent,
          OrganizationComponent,
          FormIconGroupComponent,
          ConfigCodePipe,
          EnrolmentPipe,
          EnrolleePipe,
          FormatDatePipe,
          DefaultPipe,
          PostalPipe,
          YesNoPipe
        ],
        providers: [
          {
            provide: APP_CONFIG,
            useValue: APP_DI_CONFIG
          },
          {
            provide: EnrolmentService,
            useClass: MockEnrolmentService
          },
          {
            provide: ConfigService,
            useClass: MockConfigService
          },
          ConfigCodePipe
        ]

      }
    ).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PharmanetEnrolmentCertificateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
