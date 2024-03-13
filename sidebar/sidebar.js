let winId;
browser.windows.getCurrent().then(win => {
  winId = win.id
})

class Tab {
  /**
 * Represents a browser tab.
 * @constructor
 * @param {number} id - The id of the tab
 * @param {string} title - The title of the tab.
 * @param {Tab} parent - The parent of the tab.
 * @param {Tab[]} children - The children of the tab.
 */
  constructor(id, title, parent, children) {
    this.id = id;
    this.title = title;
    this.parent = parent;
    this.children = children;
  }
}

let parentEl = document.querySelector('#sidebar');

let tabs = [];

async function updateUI() {
  tabs = await browser.tabs.query({ windowId: winId });
  for (let tab of tabs) {
    let el = document.createElement('div');
    el.className = 'tab';
    el.textContent = tab.title;
    el.addEventListener('click', () => {
      browser.tabs.update(tab.id, { active: true });
    })
    parentEl.appendChild(el);
  }
}

// called when the DOM is loaded
async function init() {
  updateUI();
  browser.tabs.onUpdated.addListener(updateUI);
  browser.tabs.onCreated.addListener(updateUI);
  browser.tabs.onRemoved.addListener(updateUI);
}

document.addEventListener('DOMContentLoaded', init);
