// don"t mock our CUT or components it depends on
jest.dontMock("../src/components/Input");
jest.dontMock("reactcss");

import React from "react";
import ReactDOM from "react-dom";
import TestUtils from "react-addons-test-utils";

// TODO: move this to es6 style import when its implemented in jest
const Input = require("../src/components/Input").default;


describe("Input", () => {

  it("Does render a Input with default text", () => {
    const text = "howdy";

    // Render a Input
    const inputComponent = TestUtils.renderIntoDocument(
        <Input value={text} />
    );

    // grab the DOM node so we can inspect it
    const inputNode = ReactDOM.findDOMNode(inputComponent);

    // Verify that it"s rendered with the right text
    // NOTE: This will ALWAYS grab the value at initialization time
    //       Use the 'value' property if you're looking for the text value
    expect(inputNode.getAttribute("value")).toEqual(text);

  });
});
