import 'Frontend/demo/init'; // hidden-source-line

import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import '@vaadin/email-field';
import '@vaadin/form-layout';
import type { FormLayoutResponsiveStep } from '@vaadin/form-layout';
import '@vaadin/split-layout';
import '@vaadin/text-field';
import { applyTheme } from 'Frontend/generated/theme';

@customElement('form-layout-custom-layout')
export class Example extends LitElement {
  protected createRenderRoot() {
    const root = super.createRenderRoot();
    // Apply custom theme (only supported if your app uses one)
    applyTheme(root);
    return root;
  }

  // tag::snippet[]
  private responsiveSteps: FormLayoutResponsiveStep[] = [
    // Use one column by default
    { minWidth: 0, columns: 1 },
    // Use two columns, if the layout's width exceeds 320px
    { minWidth: '320px', columns: 2 },
    // Use three columns, if the layout's width exceeds 500px
    { minWidth: '500px', columns: 3 },
  ];

  render() {
    return html`
      <vaadin-split-layout>
        <vaadin-form-layout .responsiveSteps="${this.responsiveSteps}">
          <vaadin-text-field label="First name"></vaadin-text-field>
          <vaadin-text-field label="Last name"></vaadin-text-field>
          <vaadin-email-field label="Email"></vaadin-email-field>
        </vaadin-form-layout>
        <div></div>
      </vaadin-split-layout>
    `;
  }
  // end::snippet[]
}
