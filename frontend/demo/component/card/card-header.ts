import 'Frontend/demo/init'; // hidden-source-line
import '@vaadin/card';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { applyTheme } from 'Frontend/generated/theme';

@customElement('card-header')
export class Example extends LitElement {
  protected override createRenderRoot() {
    const root = super.createRenderRoot();
    // Apply custom theme (only supported if your app uses one)
    applyTheme(root);
    return root;
  }

  protected override render() {
    return html`
      <!-- tag::snippet[] -->
      <vaadin-card>
        <!-- tag::[] -->
        <div slot="header" class="leading-xs">
          <div class="uppercase text-xs text-secondary">The Exotic North</div>
          <h2>Lapland</h2>
        </div>
        <!-- end::[] -->
        <div>Lapland is the northern-most region of Finland and an active outdoor destination.</div>
      </vaadin-card>
      <!-- end::snippet[] -->
    `;
  }

  static styles = css`
    vaadin-card {
      max-width: 300px;
    }
  `;
}
