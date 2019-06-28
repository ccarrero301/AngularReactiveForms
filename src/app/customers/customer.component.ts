import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn } from '@angular/forms';

import { debounceTime } from 'rxjs/operators';

import { Customer } from './customer';

function ratingRange(min: number, max: number): ValidatorFn {
  return (c: AbstractControl): { [key: string]: boolean } | null => {
    if (c.value !== null && (isNaN(c.value) || c.value < min || c.value > max)) {
      return { 'range': true };
    }
    return null;
  };
}

function emailMatcher(c: AbstractControl): { [key: string]: boolean } | null {
  const emailControl = c.get('email');
  const confirmEmailControl = c.get('confirmEmail');

  if (emailControl.pristine || confirmEmailControl.pristine) {
    return null;
  }

  if (emailControl.value === confirmEmailControl.value) {
    return null;
  }

  console.log('does not match');
  return { 'match': true };
}

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {

  customerForm: FormGroup;
  customer = new Customer();

  firstNameMessage = '';
  firstNameValidationMessages: any = {
    required: 'Please enter your first name.',
    minlength: 'The first name must be longer than 3 characters.'
  };

  lastNameMessage = '';
  lastNameValidationMessages: any = {
    required: 'Please enter your last name.',
    maxlength: 'The last name must be less than 50 characters.'
  };

  emailMessage = '';
  emailValidationMessages: any = {
    required: 'Please enter your email address.',
    email: 'Please enter a valid email address.'
  };

  constructor(private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.customerForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      emailGroup: this.formBuilder.group({
        email: ['', [Validators.required, Validators.email]],
        confirmEmail: ['', Validators.required]
      }, { validator: emailMatcher }),
      phone: '',
      notification: 'email',
      rating: [null, ratingRange(1, 5)],
      sendCatalog: true
    });

    this.customerForm.get('notification').valueChanges.subscribe(value =>
      this.setNotification(value)
    );

    const firstNameControl = this.customerForm.get('firstName');
    firstNameControl.valueChanges.subscribe(
      value => this.firstNameMessage = this.setMessage(firstNameControl, this.firstNameValidationMessages));

    const lastNameControl = this.customerForm.get('lastName');
    lastNameControl.valueChanges.subscribe(
      value => this.lastNameMessage = this.setMessage(lastNameControl, this.lastNameValidationMessages));

    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(
      value => this.emailMessage = this.setMessage(emailControl, this.emailValidationMessages));
  }

  setMessage(control: AbstractControl, validationMessages: any): string {
    let outputErrorMessage = '';

    if ((control.touched || control.dirty) && control.errors) {
      outputErrorMessage = Object.keys(control.errors).map(
        key => outputErrorMessage += validationMessages[key]).join(' ');

      return outputErrorMessage;
    }
  }

  save() {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }

  setNotification(notifyVia: string) {
    const phoneControl = this.customerForm.get('phone');

    if (notifyVia === 'text') {
      phoneControl.setValidators(Validators.required);
    } else {
      phoneControl.clearValidators();
    }

    phoneControl.updateValueAndValidity();
  }

  populateTestData(): void {
    this.customerForm.setValue({
      firstName: 'Jack',
      lastName: 'Harkness',
      email: 'jack@torchwood.com',
      phone: '',
      notification: 'email',
      sendCatalog: false
    });
  }
}
