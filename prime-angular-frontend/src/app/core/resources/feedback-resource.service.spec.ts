import { TestBed } from '@angular/core/testing';

import { FeedbackResourceService } from './feedback-resource.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { APP_CONFIG, APP_DI_CONFIG } from 'app/app-config.module';
import { SharedModule } from '@shared/shared.module';

describe('FeedbackResourceService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [
      HttpClientTestingModule,
      SharedModule
    ],
    providers: [
      {
        provide: APP_CONFIG,
        useValue: APP_DI_CONFIG
      }
    ]
  }));

  it('should be created', () => {
    const service: FeedbackResourceService = TestBed.inject(FeedbackResourceService);
    expect(service).toBeTruthy();
  });
});
