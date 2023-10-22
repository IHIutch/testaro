/*
  htmlcs
  This test implements the HTML CodeSniffer ruleset.
*/

// IMPORTS

// Module to handle files.
const fs = require('fs/promises');

// FUNCTIONS

// Runs HTML CodeSniffer on the page and returns an act report.
exports.reporter = async (page, options) => {
  const {report, act, rules} = options;
  const data = {};
  const result = {};
  // Get the HTMLCS script.
  const scriptText = await fs.readFile(`${__dirname}/../htmlcs/HTMLCS.js`, 'utf8');
  const scriptNonce = report.jobData && report.jobData.lastScriptNonce;
  // Define the rules to be employed as those of WCAG 2 level AAA.
  let messageStrings = [];
  for (const actStandard of ['WCAG2AAA']) {
    const nextIssues = await page.evaluate(args => {
      // Add the HTMLCS script to the page.
      const scriptText = args[2];
      const scriptNonce = args[3];
      const script = document.createElement('script');
      script.nonce = scriptNonce;
      script.textContent = scriptText;
      document.head.insertAdjacentElement('beforeend', script);
      // If only some rules are to be employed:
      const actStandard = args[0];
      const rules = args[1];
      if (rules && Array.isArray(rules) && rules.length) {
        // Redefine WCAG 2 AAA as including only them.
        if (! window.HTMLCS_WCAG2AAA) {
          window.HTMLCS_WCAG2AAA = {};
        }
        window.HTMLCS_WCAG2AAA.sniffs = rules;
      }
      // Run the tests.
      let issues = null;
      try {
        issues = window.HTMLCS_RUNNER.run(actStandard);
      }
      catch(error) {
        console.log(`ERROR executing HTMLCS_RUNNER on ${document.URL} (${error.message})`);
      }
      return issues;
    }, [actStandard, rules, scriptText, scriptNonce]);
    if (nextIssues && nextIssues.every(issue => typeof issue === 'string')) {
      messageStrings.push(... nextIssues);
    }
    else {
      data.prevented = true;
      data.error = 'ERROR executing HTMLCS_RUNNER in the page';
      break;
    }
  }
  if (! data.prevented) {
    // Sort the issues by class and standard.
    messageStrings.sort();
    // Remove any duplicate issues.
    messageStrings = [... new Set(messageStrings)];
    // Initialize the result.
    result.Error = {};
    result.Warning = {};
    // For each issue:
    messageStrings.forEach(string => {
      const parts = string.split(/\|/, 6);
      const partCount = parts.length;
      if (partCount < 6) {
        console.log(`ERROR: Issue string ${string} has too few parts`);
      }
      // If it is an error or a warning (not a notice):
      else if (['Error', 'Warning'].includes(parts[0])) {
        /*
          Add the issue to an issueClass.issueCode.description array in the result.
          This saves space, because, although some descriptions are issue-specific, such as
          descriptions that state the contrast ratio of an element, most descriptions are
          generic, so typically many violations share a description.
        */
        const issueCode = parts[1].replace(/^WCAG2|\.Principle\d\.Guideline[\d_]+/g, '');
        if (! result[parts[0]][issueCode]) {
          result[parts[0]][issueCode] = {};
        }
        if (! result[parts[0]][issueCode][parts[4]]) {
          result[parts[0]][issueCode][parts[4]] = [];
        }
        result[parts[0]][issueCode][parts[4]].push({
          tagName: parts[2],
          id: parts[3],
          code: parts[5]
        });
      }
    });
  }
  return {
    data,
    result
  };
};
