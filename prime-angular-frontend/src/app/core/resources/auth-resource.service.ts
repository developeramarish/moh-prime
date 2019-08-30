import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { environment } from 'src/environments/environment.prod';

import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';

import { LoggerService } from '../services/logger.service';
import { AuthTokenService } from '../services/auth-token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthResource {
  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private http: HttpClient,
    private logger: LoggerService,
    private tokenService: AuthTokenService
  ) { }

  /**
   * Authenticate a user.
   *
   * @param {{ email: string, password: string }} payload
   * @returns {Observable<boolean>}
   * @memberof AuthResource
   */
  public login(payload: { email: string, password: string }): Observable<boolean> {
    const resourceUri = `${environment.apiEndpoint}/login`;
    return this.http.post(resourceUri, payload)
      .pipe(
        map((response: { token: string }) => {
          this.tokenService.setToken(response.token);

          const claim = this.tokenService.decodeToken();

          this.logger.info('Authenticated!', claim);

          return true;
        })
      );
  }

}
