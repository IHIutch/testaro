/*
  zIndex
  This test reports elements with non-auto z indexes. It assumes that pages are most accessible
  when they do not require users to perceive a third dimension (depth). Layers, popups, and dialogs
  that cover other content make it difficult for some or all users to interpret the content and
  know what parts of the content can be acted on. Layering also complicates accessibility control.
  Tests for visibility of focus, for example, may fail if incapable of detecting that a focused
  element is covered by another element.
*/

// ########## IMPORTS

// Module to perform common operations.
const {report} = require('../procs/testaro');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Initialize the locators and result.
  const areLifted = await page.evaluate(() => {
    const allElements = Array.from(document.querySelectorAll('body *'));
    return allElements.map(el => {
      const styleDec = window.getComputedStyle(el);
      return styleDec.zIndex !== 'auto';
    });
  });
  // Get locators for all body descendants.
  const allLoc = await page.locator('body *');
  const allLocs = await allLoc.all();
  // Get the result.
  const all = {
    locs: allLocs.filter((loc, index) => areLifted[index]),
    result: {
      data: {},
      totals: [0, 0, 0, 0],
      standardInstances: []
    }
  };
  // Populate and return the result.
  const whats = [
    'Element has a non-default Z index (__param__)', 'Elements have non-default Z indexes'
  ];
  return await report(withItems, all, 'zIndex', whats, 0);
};
