/*
  © 2021–2023 CVS Health and/or one of its affiliates. All rights reserved.

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/

/*
  wave
  This test implements the WebAIM WAVE ruleset for accessibility. The 'reportType' argument
  specifies a WAVE report type: 1, 2, 3, or 4. The larger the number, the more detailed (and
  expensive) the report.
*/
const fs = require('fs/promises');
const https = require('https');
exports.reporter = async (page, options) => {
  const {reportType, rules} = options;
  const waveKey = process.env.WAVE_KEY;
  // Get the data from a WAVE test.
  const data = {};
  const result = await new Promise(resolve => {
    https.get(
      {
        host: 'wave.webaim.org',
        path: `/api/request?key=${waveKey}&url=${page.url()}&reporttype=${reportType}`,
        protocol: 'https:'
      },
      response => {
        let actReport = '';
        response.on('data', chunk => {
          actReport += chunk;
        });
        // When the data arrive:
        response.on('end', async () => {
          try {
            // Delete unnecessary properties.
            const actResult = JSON.parse(actReport);
            const {categories} = actResult;
            delete categories.feature;
            delete categories.structure;
            delete categories.aria;
            // If rules were specified:
            if (rules && rules.length) {
              // Delete the results of tests for other rules.
              ['error', 'contrast', 'alert'].forEach(category => {
                if (
                  categories[category]
                  && categories[category].items
                  && Object.keys(categories[category].items).length
                ) {
                  Object.keys(categories[category].items).forEach(ruleID => {
                    if (! rules.includes(ruleID)) {
                      delete categories[category].items[ruleID];
                    }
                  });
                }
              });
            }
            // Add WCAG information from the WAVE documentation.
            const waveDocJSON = await fs.readFile('procs/wavedoc.json');
            const waveDoc = JSON.parse(waveDocJSON);
            Object.keys(categories).forEach(categoryName => {
              const category = categories[categoryName];
              const {items} = category;
              Object.keys(items).forEach(issueName => {
                const issueDoc = waveDoc.find((issue => issue.name === issueName));
                const {guidelines} = issueDoc;
                items[issueName].wcag = guidelines;
              });
            });
            return resolve(actResult);
          }
          catch (error) {
            data.prevented = true;
            data.error = error.message;
            return resolve({
              actReport
            });
          }
        });
      }
    );
  });
  return {
    data,
    result
  };
};
