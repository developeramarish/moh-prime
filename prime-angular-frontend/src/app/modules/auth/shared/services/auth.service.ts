import { Injectable } from '@angular/core';

import { from, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { KeycloakLoginOptions } from 'keycloak-js';

import { LoggerService } from '@core/services/logger.service';

import { User } from '@auth/shared/models/user.model';
import { Admin } from '@auth/shared/models/admin.model';
import { BrokerProfile } from '@auth/shared/models/broker-profile.model';
import { AccessTokenParsed } from '@auth/shared/models/access-token-parsed.model';
import { Role } from '@auth/shared/enum/role.enum';
import { IdentityProvider } from '@auth/shared/enum/identity-provider.enum';
import { AccessTokenService } from '@auth/shared/services/access-token.service';

export interface IAuthService {
  login(options?: KeycloakLoginOptions): Promise<void>;
  isLoggedIn(): Promise<boolean>;
  identityProvider(): Promise<IdentityProvider>;
  identityProvider$(): Observable<IdentityProvider>;
  logout(redirectUri: string): Promise<void>;

  getUser(forceReload?: boolean): Promise<User>;
  getUser$(forceReload?: boolean): Observable<User>;
  getAdmin(forceReload?: boolean): Promise<Admin>;
  getAdmin$(forceReload?: boolean): Observable<Admin>;

  isEnrollee(): boolean;
  isRegistrant(): boolean;
  isAdmin(): boolean;
  isSuperAdmin(): boolean;
  hasAdminView(): boolean;
  hasCommunityPharmacist(): boolean;
  hasVCIssuance(): boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService implements IAuthService {
  // Login event state for performing operations
  // required immediately after authentication
  private hasJustLoggedInState: boolean;

  constructor(
    private accessTokenService: AccessTokenService,
    private logger: LoggerService
  ) { }

  public set hasJustLoggedIn(hasJustLoggedIn: boolean) {
    this.hasJustLoggedInState = hasJustLoggedIn;
  }

  public get hasJustLoggedIn(): boolean {
    return this.hasJustLoggedInState;
  }

  public login(options?: any): Promise<void> {
    return this.accessTokenService.login(options);
  }

  public isLoggedIn(): Promise<boolean> {
    return this.accessTokenService.isLoggedIn();
  }

  public async identityProvider(): Promise<IdentityProvider> {
    return await this.accessTokenService.decodeToken()
      .then((token: AccessTokenParsed) => token.identity_provider);
  }

  public identityProvider$(): Observable<IdentityProvider> {
    return from(this.identityProvider()).pipe(take(1));
  }

  public logout(redirectUri: string = '/'): Promise<void> {
    return this.accessTokenService.logout(redirectUri);
  }

  /**
   * @description
   * Get the authenticated user.
   *
   * NOTE: Careful using this in Angular lifecycle hooks. It is preferrable to
   * use the Observable based method getUser$().
   */
  // TODO should be based this on provider now
  // TODO use this as a base method for all other types of users
  public async getUser(forceReload?: boolean): Promise<User> {
    const {
      firstName,
      lastName,
      email: email = '',
      attributes: {
        birthdate: [dateOfBirth] = '',
        country: [countryCode] = '',
        region: [provinceCode] = '',
        streetAddress: [street] = '',
        locality: [city] = '',
        postalCode: [postal] = '',
        givenNames: [givenNames] = ''
      }
    } = await this.accessTokenService.loadBrokerProfile(forceReload) as BrokerProfile;

    const userId = await this.getUserId();
    const claims = await this.getTokenAttribsByKey('hpdid');

    return {
      userId,
      firstName,
      lastName,
      givenNames,
      dateOfBirth,
      physicalAddress: {
        countryCode,
        provinceCode,
        street,
        city,
        postal
      },
      email,
      ...claims
    } as User;
  }

  public getUser$(forceReload?: boolean): Observable<User> {
    return from(this.getUser(forceReload)).pipe(take(1));
  }

  /**
   * @description
   * Get the authenticated user.
   *
   * NOTE: Careful using this in Angular lifecycle hooks. It is preferrable to
   * use the Observable based method getAdmin$().
   */
  // TODO drop after getUser providers object instance of auth user
  public async getAdmin(forceReload?: boolean): Promise<Admin> {
    const {
      firstName,
      lastName,
      email
    } = await this.accessTokenService.loadBrokerProfile(forceReload) as BrokerProfile;

    const userId = await this.getUserId();
    const claims = await this.getTokenAttribsByKey('idir');

    return {
      userId,
      firstName,
      lastName,
      email,
      ...claims
    } as Admin;
  }

  public getAdmin$(forceReload?: boolean): Observable<Admin> {
    return from(this.getAdmin(forceReload)).pipe(take(1));
  }

  public isEnrollee(): boolean {
    return this.accessTokenService.hasRole(Role.ENROLLEE);
  }

  public isRegistrant(): boolean {
    return this.accessTokenService.hasRole(Role.FEATURE_SITE_REGISTRATION);
  }

  public isAdmin(): boolean {
    return this.accessTokenService.hasRole(Role.ADMIN);
  }

  public isSuperAdmin(): boolean {
    return this.accessTokenService.hasRole(Role.SUPER_ADMIN);
  }

  public hasAdminView(): boolean {
    return this.accessTokenService.hasRole(Role.READONLY_ADMIN);
  }

  public hasCommunityPharmacist(): boolean {
    return this.accessTokenService.hasRole(Role.FEATURE_COMMUNITY_PHARMACIST);
  }

  public hasVCIssuance(): boolean {
    return this.accessTokenService.hasRole(Role.FEATURE_VC_ISSUANCE);
  }

  private async getUserId(): Promise<string> {
    const token = await this.accessTokenService.decodeToken();

    this.logger.info('TOKEN', token);

    return token.sub;
  }

  private async checkAssuranceLevel(assuranceLevel: number): Promise<boolean> {
    const token = await this.accessTokenService.decodeToken();
    return token.identity_assurance_level === assuranceLevel;
  }

  private async getTokenAttribsByKey(keys: string | string[]): Promise<{ [key: string]: any }> {
    const token = await this.accessTokenService.decodeToken();

    return (Array.isArray(keys))
      ? keys.reduce((attribs: { [key: string]: any }, key: string) => {
        return { ...attribs, [key]: token[key] };
      }, {})
      : { [keys]: token[keys] };
  }
}
