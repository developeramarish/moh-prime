import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormArray, FormBuilder } from '@angular/forms';

import { Subscription } from 'rxjs';

import { RouteUtils } from '@lib/utils/route-utils.class';
import { FormUtilsService } from '@core/services/form-utils.service';
import { Country } from '@shared/enums/country.enum';
import { Province } from '@shared/enums/province.enum';

import { SiteRoutes } from '@registration/site-registration.routes';
import { RemoteUser } from '@registration/shared/models/remote-user.model';
import { SiteService } from '@registration/shared/services/site.service';
import { SiteFormStateService } from '@registration/shared/services/site-form-state.service';
import { RemoteUserCertification } from '@registration/shared/models/remote-user-certification.model';

@Component({
  selector: 'app-remote-user',
  templateUrl: './remote-user.component.html',
  styleUrls: ['./remote-user.component.scss']
})
export class RemoteUserComponent implements OnInit {
  public busy: Subscription;
  public parent: FormGroup;
  public form: FormGroup;
  public routeUtils: RouteUtils;
  public isCompleted: boolean;
  public remoteUser: RemoteUser;
  public formControlNames: string[];
  public SiteRoutes = SiteRoutes;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private siteService: SiteService,
    private siteFormStateService: SiteFormStateService,
    private formUtilsService: FormUtilsService
  ) {
    this.routeUtils = new RouteUtils(route, router, SiteRoutes.MODULE_PATH);
    this.formControlNames = [
      'street',
      'city',
      'provinceCode',
      'postal'
    ];
  }

  public get remoteUserLocations(): FormArray {
    return this.form.get('remoteUserLocations') as FormArray;
  }

  public get remoteUserCertifications(): FormArray {
    return this.form.get('remoteUserCertifications') as FormArray;
  }

  public get selectedCollegeCodes(): number[] {
    return this.remoteUserCertifications.value
      .map((certification: RemoteUserCertification) => +certification.collegeCode);
  }

  public onSubmit() {
    if (this.formUtilsService.checkValidity(this.form)) {

      this.removeIncompleteCertifications(true);

      const remoteUserIndex = this.route.snapshot.params.index;
      const remoteUsersFormArray = this.parent.get('remoteUsers') as FormArray;

      if (remoteUserIndex !== 'new') {
        const remoteUserFormGroup = remoteUsersFormArray.at(remoteUserIndex);
        const remoteUserLocationsFormArray = remoteUserFormGroup.get('remoteUserLocations') as FormArray;
        const certificationFormArray = remoteUserFormGroup.get('remoteUserCertifications') as FormArray;

        // Changes in the amount of locations requires adjusting the number of
        // locations in the parent, which is not handled automatically
        if (this.remoteUserLocations.length !== remoteUserLocationsFormArray.length) {
          remoteUserLocationsFormArray.clear();

          Object.keys(this.remoteUserLocations.controls)
            .map(() => this.siteFormStateService.remoteUserLocationFormGroup())
            .forEach((group: FormGroup) => remoteUserLocationsFormArray.push(group));
        }

        // Changes in the amount of locations requires adjusting the number of
        // locations in the parent, which is not handled automatically
        if (this.remoteUserCertifications.length !== certificationFormArray.length) {
          certificationFormArray.clear();

          Object.keys(this.remoteUserCertifications.controls)
            .map(() => this.siteFormStateService.remoteUserCertificationFormGroup())
            .forEach((group: FormGroup) => certificationFormArray.push(group));
        }

        // Replace the updated remote user in the parent form for submission
        remoteUserFormGroup.reset(this.form.getRawValue());
      } else {
        // Store the new remote user in the parent form for submission
        remoteUsersFormArray.push(this.form);
      }

      this.nextRoute();
    }
  }

  public addLocation() {
    this.addRemoteUserLocation();
  }

  public removeLocation(index: number) {
    this.remoteUserLocations.removeAt(index);

    if (!this.remoteUserLocations.controls.length) {
      this.addRemoteUserLocation();
    }
  }

  public addCertification() {
    const remoteUserCertification = this.siteFormStateService.remoteUserCertificationFormGroup();
    this.remoteUserCertifications.push(remoteUserCertification);
  }

  /**
   * @description
   * Removes a certification from the list in response to an
   * emitted event from college certifications. Does not allow
   * the list of certifications to empty.
   *
   * @param index to be removed
   */
  public removeCertification(index: number) {
    this.remoteUserCertifications.removeAt(index);
  }

  public onBack() {
    // TODO canDeactive check if unsaved changes
    this.routeUtils.routeRelativeTo(['./']);
  }

  public nextRoute() {
    // Inform the remote users view not to patch the form, otherwise updates will be lost
    this.routeUtils.routeRelativeTo(['./'], { queryParams: { fromRemoteUser: true } });
  }

  public ngOnInit(): void {
    this.createFormInstance();
    this.initForm();
  }

  private createFormInstance() {
    // Set the parent form for updating on submission, but otherwise use the
    // local form group for all changes
    this.parent = this.siteFormStateService.remoteUsersForm;
  }

  private initForm() {
    const site = this.siteService.site;
    this.isCompleted = site?.completed;

    // Attempt to patch if needed on a refresh, otherwise do not forceably
    // update the form state as it will drop unsaved updates
    this.siteFormStateService.setForm(site);

    const remoteUserIndex = this.route.snapshot.params.index;
    const remoteUser = this.parent.getRawValue().remoteUsers[remoteUserIndex] as RemoteUser;

    // Remote user at index does not exist likely due to a browser
    // refresh on this page, and the URL param should be update
    if (remoteUserIndex !== 'new' && !remoteUser) {
      this.routeUtils.routeRelativeTo(['new']);
    }

    // Create a local form group for creating or updating remote users
    this.form = this.siteFormStateService
      .createEmptyRemoteUserFormAndPatch(remoteUser);

    // Remote user index and "new" were used instead of ID and 0 since the
    // remote users can't be persisted immediately, and need to be stored
    // locally for submission by the sibling view. Therefore, there could
    // be multiple "new" entries without an unique identifier that might
    // be edited prior to submission so it was necessary to use an index
    (remoteUserIndex !== 'new' && remoteUser)
      ? this.disableProvince(this.remoteUserLocations.controls as FormGroup[])
      : this.addRemoteUserLocation();

    if (!this.remoteUserCertifications.length) {
      this.addCertification();
    }
  }

  private addRemoteUserLocation(): void {
    const remoteUserLocation = this.siteFormStateService
      .remoteUserLocationFormGroup();
    remoteUserLocation.get('physicalAddress')
      .patchValue({
        countryCode: Country.CANADA,
        provinceCode: Province.BRITISH_COLUMBIA
      });
    this.disableProvince(remoteUserLocation);

    this.remoteUserLocations.push(remoteUserLocation);
  }

  private disableProvince(remoteUserLocationFormGroups: FormGroup | FormGroup[]): void {
    (Array.isArray(remoteUserLocationFormGroups))
      ? remoteUserLocationFormGroups.forEach(group => this.disableProvince(group))
      : remoteUserLocationFormGroups.get('physicalAddress.provinceCode').disable();
  }

  /**
   * @description
   * Removes incomplete certifications from the list in preparation
   * for submission, and allows for an empty list of certifications.
   */
  private removeIncompleteCertifications(noEmptyCert: boolean = false) {
    this.remoteUserCertifications.controls
      .forEach((control: FormGroup, index: number) => {
        // Remove if college code is "None" or the group is invalid
        if (!control.get('collegeCode').value || control.invalid) {
          this.removeCertification(index);
        }
      });

    // Always have a single certification available, and it prevents
    // the page from jumping too much when routing
    if (!noEmptyCert && !this.remoteUserCertifications.controls.length) {
      this.addCertification();
    }
  }
}
