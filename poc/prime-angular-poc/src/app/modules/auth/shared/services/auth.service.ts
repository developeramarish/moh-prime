import { Injectable } from '@angular/core';

import { KeycloakService } from 'keycloak-angular';
import { JwtHelperService } from '@auth0/angular-jwt';

import { LoggerService } from '@core/services/logger.service';
import { Role } from '@auth/shared/enum/role.enum';
import { User } from '@auth/shared/models/user.model';

export interface IAuthService {
  hasJustLoggedIn: boolean;
  getUserId(): Promise<string>;
  getUser(forceReload?: boolean): Promise<User>;
  getUserRoles(): string[];
  isUserInRole(role: string): boolean;
  checkAssuranceLevel(assuranceLevel: number): Promise<boolean>;
  // TODO what role is accessing the POS?
  isEnrollee(): Promise<boolean>;
  decodeToken(): Promise<Keycloak.KeycloakTokenParsed | null>;
  login(options?: Keycloak.KeycloakLoginOptions): Promise<void>;
  isLoggedIn(): Promise<boolean>;
  logout(redirectUri: string): Promise<void>;
  isTokenExpired(): boolean;
  clearToken(): void;
}

export interface KeycloakAttributes {
  attributes: {
    birthdate: string[];
    country: string[];
    region: string[]; // Province
    streetAddress: string[];
    locality: string[]; // City
    postalCode: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService implements IAuthService {

  private jwtHelper: JwtHelperService;

  public hasJustLoggedIn: boolean;

  constructor(
    private keycloakService: KeycloakService,
    private logger: LoggerService
  ) {
    this.jwtHelper = new JwtHelperService();
  }

  public async getUserId(): Promise<string> {
    const token = await this.decodeToken();

    this.logger.info('TOKEN', token);

    return token.sub;
  }

  public async getUser(forceReload?: boolean): Promise<User> {
    const {
      firstName,
      lastName,
      email: contactEmail = '',
      attributes: {
        birthdate: [dateOfBirth] = '',
        country: [countryCode] = '',
        region: [provinceCode] = '',
        streetAddress: [street] = '',
        locality: [city] = '',
        postalCode: [postal] = ''
      }
    } = await this.keycloakService.loadUserProfile(forceReload) as Keycloak.KeycloakProfile & KeycloakAttributes;

    const userId = await this.getUserId();

    return {
      userId,
      firstName,
      lastName,
      dateOfBirth,
      physicalAddress: {
        countryCode,
        provinceCode,
        street,
        city,
        postal
      },
      contactEmail
    };
  }

  public async checkAssuranceLevel(assuranceLevel: number): Promise<boolean> {
    const token = await this.decodeToken() as any;
    return (token.identity_assurance_level === assuranceLevel);
  }

  public getUserRoles(allRoles?: boolean): string[] {
    return this.keycloakService.getUserRoles(allRoles);
  }

  public isUserInRole(role: string): boolean {
    return this.keycloakService.isUserInRole(role);
  }
  // TODO what role is accessing the POS?
  public async isEnrollee(): Promise<boolean> {
    return this.isUserInRole(Role.ENROLLEE) && await this.checkAssuranceLevel(3);
  }

  public async decodeToken(): Promise<Keycloak.KeycloakTokenParsed | null> {
    const token = await this.keycloakService.getToken();
    return (token) ? this.jwtHelper.decodeToken(token) : null;
  }

  public login(options?: Keycloak.KeycloakLoginOptions): Promise<void> {
    return this.keycloakService.login(options);
  }

  public isLoggedIn(): Promise<boolean> {
    return this.keycloakService.isLoggedIn();
  }

  public logout(redirectUri: string = '/'): Promise<void> {
    return this.keycloakService.logout(redirectUri);
  }

  public isTokenExpired(): boolean {
    return this.keycloakService.isTokenExpired();
  }

  public clearToken() {
    this.keycloakService.clearToken();
  }

  public setHasJustLoggedIn(hasJustLoggedIn: boolean) {
    this.hasJustLoggedIn = hasJustLoggedIn;
  }

  public getHasJustLoggedIn(): boolean {
    return this.hasJustLoggedIn;
  }
}
