/*
  pseudoP
  Related to Tenon rule 242.
  This test reports 2 or more sequential br elements. They may be inferior substitutes for a
  p element.
*/

// ########## IMPORTS

// Module to perform common operations.
const {init, report} = require('../procs/testaro');

// ########## FUNCTIONS

// Runs the test and returns the result.
exports.reporter = async (page, withItems) => {
  // Initialize the locators and result.
  const all = await init(100, page, 'body br + br');
  // For each locator:
  for (const loc of all.allLocs) {
    // Return whether the second br element violates the rule.
    const parentTagNameIfBad = await loc.evaluate(el => {
      el.parentElement.normalize();
      const previousSib = el.previousSibling;
      return previousSib.nodeType === Node.ELEMENT_NODE
      || previousSib.nodeType === Node.TEXT_NODE && /^\s+$/.test(previousSib)
      ? el.parentElement.tagName
      : false;
    });
    // If it does:
    if (parentTagNameIfBad) {
      // Add the locator to the array of violators.
      all.locs.push([loc, parentTagNameIfBad]);
    }
  };
  // Populate and return the result.
  const whats = [
    'Adjacent br elements within a __param__ element may be pseudo-paragraphs',
    'Elements contain 2 or more adjacent br elements that may be pseudo-paragraphs'
  ];
  return await report(withItems, all, 'pseudoP', whats, 0, 'br');
};
