/*
  zIndex
  This test reports elements with non-auto z indexes. It assumes that pages are most accessible
  when they do not require users to perceive a third dimension (depth). Layers, popups, and dialogs
  that cover other content make it difficult for some or all users to interpret the content and
  know what parts of the content can be acted on. Layering also complicates accessibility control.
  Tests for visibility of focus, for example, may fail if incapable of detecting that a focused
  element is covered by another element.
*/
exports.reporter = async (page, withItems) => {
  // Get data on the elements with non-auto z indexes.
  const data = await page.$$eval('body *', (elements, withItems) => {
    // Initialize the data.
    const data = {
      totals: {
        total: 0,
        tagNames: {}
      }
    };
    if (withItems) {
      data.items = [];
    }
    const addElementFacts = element => {
      const tagName = element.tagName;
      const tagNames = data.totals.tagNames;
      if (tagNames[tagName]) {
        tagNames[tagName]++;
      }
      else {
        tagNames[tagName] = 1;
      }
      if (withItems) {
        data.items.push({
          tagName,
          id: element.id || '',
          text:
          (element.textContent.trim() || element.outerHTML.trim())
          .replace(/\s+/g, ' ')
          .slice(0, 100)
        });
      }
    };
    elements.forEach(element => {
      if (window.getComputedStyle(element)['z-index'] !== 'auto') {
        data.totals.total++;
        addElementFacts(element);
      }
    });
    return data;
  }, withItems);
  const standardInstances = [];
  if (data.items) {
    data.items.forEach(item => {
      standardInstances.push({
        ruleID: 'zIndex',
        what: 'Element has a non-default Z index',
        ordinalSeverity: 0,
        tagName: item.tagName,
        id: item.id,
        location: {
          doc: '',
          type: '',
          spec: ''
        },
        excerpt: item.text
      });
    });
  }
  else if (data.totals.total) {
    standardInstances.push({
      ruleID: 'zIndex',
      what: 'Elements have non-default Z indexes',
      count: data.totals.total,
      ordinalSeverity: 0,
      tagName: '',
      id: '',
      location: {
        doc: '',
        type: '',
        spec: ''
      },
      excerpt: ''
    });
  }
  return {
    data,
    totals: [data.totals.total, 0, 0, 0],
    standardInstances
  };
};
