import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MockAuthService } from 'test/mocks/mock-auth.service';

import { InfoComponent } from './info.component';
import { APP_CONFIG, APP_DI_CONFIG } from 'app/app-config.module';
import { AuthService } from '@auth/shared/services/auth.service';
import { NgxContextualHelpModule } from '@lib/modules/ngx-contextual-help/ngx-contextual-help.module';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { PageSubheaderComponent } from '@shared/components/page-subheader/page-subheader.component';
import { PillComponent } from '@auth/shared/components/pill/pill.component';
import { PrimePhoneComponent } from '@shared/components/prime-phone/prime-phone.component';
import { PrimeSupportEmailComponent } from '@shared/components/prime-support-email/prime-support-email.component';

describe('InfoComponent', () => {
  let component: InfoComponent;
  let fixture: ComponentFixture<InfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(
      {
        imports: [
          NgxContextualHelpModule
        ],
        declarations: [
          InfoComponent,
          PageHeaderComponent,
          PageSubheaderComponent,
          PillComponent,
          PrimePhoneComponent,
          PrimeSupportEmailComponent,
        ],
        providers: [
          {
            provide: APP_CONFIG,
            useValue: APP_DI_CONFIG
          },
          {
            provide: AuthService,
            useClass: MockAuthService
          }
        ]
      }
    ).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
