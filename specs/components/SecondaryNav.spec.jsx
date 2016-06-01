/* eslint func-names: "off" */

import React from 'react';
import SecondaryNav from '../../src/components/SecondaryNav';

describe('SecondaryNav', function () {
  this.header(`
  ## SecondaryNav
  `); // Markdown.

  before(() => {
    const itemStyle = {
      flex: 1,
      maxWidth: 55,
      textAlign: 'center',
    };
    const leftItems = ['Bread', '>', 'Crumbs'];
    const rightItems = ['User ▾'];
    // Runs when the Suite loads.  Use this to host your component-under-test.
    this.load(
      <SecondaryNav
        leftItems={
          leftItems.map((item, i) =>
            (
              <div
                key={i}
                style={itemStyle}
              >
                {item}
              </div>
          ))
        }
        rightItems={
          rightItems.map((item, i) =>
            (
              <div
                key={i}
                style={itemStyle}
              >
                {item}
              </div>
          ))
        }
      />
    ).width('100%').height(60);
  });

  /**
   * Documentation (Markdown)
   */
  this.footer(`
  ### SecondaryNav

  Top Navigation Bar

  #### API

  - coming soon

  `);
});