import { Injectable, Inject } from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '@env/environment';
import { APP_CONFIG, AppConfig } from 'app/app-config.module';
import { ConfigService } from '@config/config.service';
import { BaseGuard } from '@core/guards/base.guard';
import { LoggerService } from '@core/services/logger.service';
import { IdentityProviderEnum } from '@auth/shared/enum/identity-provider.enum';
import { AuthService } from '@auth/shared/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationGuard extends BaseGuard {
  constructor(
    protected authService: AuthService,
    protected logger: LoggerService,
    @Inject(APP_CONFIG) private config: AppConfig,
    private configService: ConfigService,
    private router: Router
  ) {
    super(authService, logger);
  }

  /**
   * @description
   * Check the user is authenticated, otherwise redirect
   * them to an appropriate destination.
   */
  protected canAccess(authenticated: boolean, routePath: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if (authenticated) {
        // Allow route to resolve for an authenticated user
        return resolve(true);
      }

      const routes = this.config.routes;
      const adminRoutes = [routes.adjudication];
      const moduleRoutes = [routes.enrolment, ...adminRoutes];
      const targetModule = routePath.slice(1).split('/').shift();

      // Attempt to directly redirect the user to authenticate
      // using Keycloak, otherwise redirect to the enrollee
      // authentication
      if (moduleRoutes.includes(targetModule)) {
        // Capture the user's current location, and provide it to
        // Keycloak to redirect the user to where they originated
        // once authenticated
        const redirectUri = `${environment.loginRedirectUrl}${routePath}`;
        const idpHint = (adminRoutes.includes(targetModule))
          ? IdentityProviderEnum.IDIR
          : IdentityProviderEnum.BCSC;
        const options = {
          redirectUri,
          idpHint
        };

        this.authService.login(options)
          .catch((error: any) => {
            this.logger.error(`Error occurred during attempted authentication`, error);
            this.router.navigate([routes.auth]);
          });
      } else {
        this.router.navigate([routes.auth]);
      }
      return reject(false);
    });
  }
}
