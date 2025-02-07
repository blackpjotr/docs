import 'Frontend/demo/init'; // hidden-source-line

import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '@vaadin/icon';
import '@vaadin/icons';
import '@vaadin/password-field';
import type { PasswordFieldValueChangedEvent } from '@vaadin/password-field';
import { applyTheme } from 'Frontend/generated/theme';

enum StrengthText {
  weak = 'weak',
  moderate = 'moderate',
  strong = 'strong',
}

enum StrengthColor {
  weak = 'var(--lumo-error-color)',
  moderate = '#e7c200',
  strong = 'var(--lumo-success-color)',
}

@customElement('password-field-advanced-helper')
export class Example extends LitElement {
  protected createRenderRoot() {
    const root = super.createRenderRoot();
    // Apply custom theme (only supported if your app uses one)
    applyTheme(root);
    return root;
  }

  @state()
  private strengthText: StrengthText = StrengthText.weak;

  @state()
  private strengthColor: StrengthColor = StrengthColor.weak;

  private pattern = '^(?=.*[0-9])(?=.*[a-zA-Z]).{8}.*$';

  render() {
    return html`
      <!-- tag::snippet[] -->
      <vaadin-password-field
        label="Password"
        @value-changed="${this.onPasswordChanged}"
        pattern="${this.pattern}"
        error-message="Not a valid password"
      >
        <vaadin-icon
          icon="vaadin:check"
          slot="suffix"
          style="color: var(--lumo-success-color)"
          ?hidden="${this.strengthText !== StrengthText.strong}"
        ></vaadin-icon>
        <div slot="helper">
          Password strength:
          <span style="color:${this.strengthColor}">${this.strengthText}</span>
        </div>
      </vaadin-password-field>
      <!-- end::snippet[] -->
    `;
  }

  private onPasswordChanged(e: PasswordFieldValueChangedEvent) {
    const value = e.detail.value;
    let strength: StrengthText = StrengthText.weak;
    if (value && new RegExp(this.pattern).exec(value)) {
      if (value.length > 9) {
        strength = StrengthText.strong;
      } else if (value.length > 5) {
        strength = StrengthText.moderate;
      }
    }
    this.strengthText = strength;
    this.strengthColor = StrengthColor[strength];
  }
}
