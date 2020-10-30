package com.vaadin.demo.component.numberfield;

import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.textfield.NumberField;
import com.vaadin.flow.router.Route;
import com.vaadin.demo.DemoExporter; // hidden-full-source-line

@Route("number-field-step")
public class NumberFieldStep extends Div {

    public NumberFieldStep() {
        // tag::snippet[]
        NumberField numberField = new NumberField();
        add(numberField);
        // end::snippet[]
    }

    public static class Exporter extends DemoExporter<NumberFieldStep> { // hidden-full-source-line
    } // hidden-full-source-line
}
