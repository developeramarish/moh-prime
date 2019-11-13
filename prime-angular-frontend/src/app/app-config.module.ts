
import { NgModule, InjectionToken } from '@angular/core';

import { environment } from '../environments/environment';
import { AppRoutes } from './app.routes';
import { EnrolmentRoutes } from '@enrolment/enrolent.routes';
import { ProvisionRoutes } from '@provision/provision.routes';

export let APP_CONFIG = new InjectionToken<AppConfig>('app.config');

export class AppConfig {
  apiEndpoint: string;
  loginRedirectUrl: string;
  routes: {
    auth: string;
    enrolment: string;
    provision: string;
    denied: string;
    maintenance: string;
  };
}

export const APP_DI_CONFIG: AppConfig = {
  apiEndpoint: environment.apiEndpoint,
  loginRedirectUrl: environment.loginRedirectUrl,
  routes: {
    auth: EnrolmentRoutes.MODULE_PATH,
    enrolment: EnrolmentRoutes.MODULE_PATH,
    provision: ProvisionRoutes.MODULE_PATH,
    denied: AppRoutes.DENIED,
    maintenance: AppRoutes.MAINTENANCE
  }
};

@NgModule({
  providers: [{
    provide: APP_CONFIG,
    useValue: APP_DI_CONFIG
  }]
})
export class AppConfigModule { }
