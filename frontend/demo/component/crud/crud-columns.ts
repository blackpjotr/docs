import 'Frontend/demo/init'; // hidden-source-line
import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '@vaadin/crud';
import '@vaadin/date-picker';
import '@vaadin/email-field';
import { getPeople } from 'Frontend/demo/domain/DataService';
import type Person from 'Frontend/generated/com/vaadin/demo/domain/Person';
import { applyTheme } from 'Frontend/generated/theme';

@customElement('crud-columns')
export class Example extends LitElement {
  protected createRenderRoot() {
    const root = super.createRenderRoot();
    // Apply custom theme (only supported if your app uses one)
    applyTheme(root);
    return root;
  }

  @state()
  private items: Person[] = [];

  async firstUpdated() {
    this.items = (await getPeople()).people;
  }

  render() {
    return html`
      <!-- tag::snippet[] -->
      <!-- Use 'include' or 'exclude' to select which fields to show -->
      <vaadin-crud
        exclude="lastName, address, id, subscribe, membership, pictureUrl, manager"
        .items="${this.items}"
      ></vaadin-crud>
      <!-- end::snippet[] -->
    `;
  }
}
