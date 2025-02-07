import 'Frontend/demo/init'; // hidden-source-line
import '@vaadin/rich-text-editor';
import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { applyTheme } from 'Frontend/generated/theme';
import templates from '../../../../src/main/resources/data/templates.json';

@customElement('rich-text-editor-readonly')
export class Example extends LitElement {
  protected override createRenderRoot() {
    const root = super.createRenderRoot();
    // Apply custom theme (only supported if your app uses one)
    applyTheme(root);
    return root;
  }

  @state()
  private richText = templates.richTextDelta;

  protected override render() {
    return html`
      <!-- tag::snippet[] -->
      <vaadin-rich-text-editor
        style="height: 400px;"
        readonly
        .value="${this.richText}"
      ></vaadin-rich-text-editor>
      <!-- end::snippet[] -->
    `;
  }
}
