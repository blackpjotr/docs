package com.vaadin.demo.component.richtexteditor;

import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.richtexteditor.RichTextEditor;
import com.vaadin.flow.router.Route;
import com.vaadin.demo.DemoExporter; // hidden-source-line
import com.vaadin.demo.domain.DataService;

@Route("rich-text-editor-min-max-height")
public class RichTextEditorMinMaxHeight extends Div {

    public RichTextEditorMinMaxHeight() {
        // tag::snippet[]
        RichTextEditor rte = new RichTextEditor();
        rte.setMaxHeight("400px");
        rte.setMinHeight("200px");
        String valueAsDelta = DataService.getTemplates().getRichTextDelta();
        rte.setValue(valueAsDelta);
        add(rte);
        // end::snippet[]
    }

    public static class Exporter extends // hidden-source-line
            DemoExporter<RichTextEditorMinMaxHeight> { // hidden-source-line
    } // hidden-source-line
}
