/** @type {string} */
let winId;
browser.windows.getCurrent().then(win => {
  winId = win.id;
})

/** @type {{ id: number, title: string } | undefined} */
let activeTab = undefined;

class TabArray {
  /**
   * Represents a tab group.
   * @constructor
   * @param {Tab[]} children - The tabs in the window
   */
  constructor(children) {
    this.children = children || [];
  }
  add(tab) {
    this.children.push(tab);
  }
  remove(tab) {
    this.get(tab.id).element.remove();
    this.children = this.children.filter((e) => e.id !== tab.id);
  }
  get(id) {
    return this.children.find((e) => e.id === id);
  }
}

class Tab {
  /**
 * Represents a browser tab.
 * @constructor
 * @param {number} id - The id of the tab
 * @param {string} title - The title of the tab.
 * @param {Tab | undefined} parent - The parent of the tab.
 * @param {Tab[]} children - The children of the tab.
 */
  constructor(id, title, parent, children) {
    this.id = id;
    this.title = title;
    this.parent = parent;
    this.children = new TabArray(children);
    this.updateElement = this.updateElement.bind(this);
    this.createElement = this.createElement.bind(this);
    this.createElement();
    browser.tabs.onUpdated.addListener(this.updateElement, { tabId: this.id, windowId: winId, properties: ['title'] });
  }
  createElement() {
    let wrapper = document.createElement('div');
    wrapper.id = this.id;
    let label = document.createElement('div');
    label.className = 'label';
    label.textContent = this.title;
    let children = document.createElement('div');
    children.className = 'children';
    this.children.children.forEach((e) => {
      children.appendChild(e.element);
    })
    if (this.id === activeTab.id) {
      wrapper.className = 'tab active';
    } else {
      wrapper.className = 'tab';
    }
    wrapper.appendChild(label);
    wrapper.appendChild(children);
    wrapper.addEventListener('click', () => {
      browser.tabs.update(this.id, { active: true });
    })
    this.element = wrapper;
  }
  async updateElement(id, changeInfo) {
    if (changeInfo.title) {
      this.title = changeInfo.title;
      this.element.textContent = this.title;
    }
  }
  addChild(tab) {
    this.children.push(tab);
  }
  removeChild(tab) {
    this.getChild(tab.id).element.remove();
    this.children = this.children.filter((e) => e.id !== tab.id);
  }
  getChild(id) {
    return this.children.find((e) => e.id === id);
  }
}

let parentEl = document.querySelector('#sidebar');

/** @type {{ id: number, title: string } | undefined} */
let previouslyActiveTab = undefined;

/** @type {TabArray} */
let tabs = new TabArray([]);

/** @param {string} message */
function refreshUI(message) {
  browser.tabs.query({ active: true, windowId: winId }).then(at => {
    previouslyActiveTab = activeTab;
    activeTab = {
      id: at[0].id,
      title: at[0].title,
    };
  });
  browser.tabs.query({ windowId: winId }).then(/** @param {Object[]} tbs */tbs => {
    // if (tabs.length !== 0) {
    //   let add = tbs.filter((element) => (tabs.findIndex((e) => e.id === element.id) == -1));
    //   let sub = tabs.filter((element) => (tbs.findIndex((e) => e.id === element.id) == -1));
    //   let diff = add.length - sub.length;
    //   if (diff !== 0) {
    //     console.log(message);
    //     console.log(diff);
    //   }
    // }
    tabs = new TabArray(tbs.map(tab => new Tab(tab.id, tab.title, undefined, undefined)));
    parentEl.innerHTML = '';
    for (let tab of tabs.children) {
      if (tab.parent === undefined) {
        let el = tab.element;
        tab.element = parentEl.appendChild(el);
      }
    }
  });
}

function changeActive({ previousTabId, tabId, windowId }) {
  if (windowId !== winId) {
    // console.error("windowId mismatch in changeActive", windowId, winId);
    return;
  }
  let comp = {
    atid: activeTab.id,
    paid: previouslyActiveTab?.id,
    tid: tabId,
    ptid: previousTabId,
  }
  if (activeTab.id !== previousTabId) {
    if (activeTab.id === tabId) {
      console.log("Weird.... ", comp);
    } else {
      console.log("failure and disappointment", comp);
    }
  }
  previouslyActiveTab = activeTab;
  browser.tabs.get(tabId).then(tb => {
    activeTab = {
      id: tb.id,
      title: tb.title,
    }
  }).catch(e => {
    console.error(e);
  });

  tabs = new TabArray(tabs.children.map(e => { e.element.className = 'tab'; return e; }));
  tabs.children.find((e) => e.id === tabId).element.className = 'tab active';
}

/**
  * @param {number} id
  */
function getTab(id) {
  let tab = tabs.get(id);
  console.log(JSON.stringify(tab));
}


function listTabs() {
  console.log(JSON.stringify(tabs.children));
}

function addTab(tab) {
  if (tab.windowId !== winId) {
    return;
  }
  console.log(activeTab, previouslyActiveTab);
  let parent = undefined;
  if (activeTab !== undefined) {
    if (activeTab.id !== tab.id) {
      parent = tabs.get(activeTab.id);
      console.log("adding tab: ", tab.id, tab.title);
      console.log("with parent: ", parent.id, parent.title);
      let tb = new Tab(tab.id, tab.title, parent, undefined);
      parent.children.add(tb);
    } else {
      parent = tabs.get(previouslyActiveTab.id);
      console.log("adding tab", tab.id, tab.title);
      console.log("with parent: ", parent.id, parent.title);
      let tb = new Tab(tab.id, tab.title, parent, undefined);
      tabs.add(tb);
      parentEl.appendChild(tb.element);
    }
  } else {
    console.log("not sure here");
  }
  tabs.add(new Tab(tab.id, tab.title, parent, undefined));
}

function removeTab(tabId, { windowId }) {
  if (windowId === winId) {
    let el = parentEl.querySelector('#' + tabId);
    console.log(`removing tab ${tabId} ${el.innerHTML}`);
    tabs.remove(tabId);
  }
}

let hasInit = false;

// called when the DOM is loaded
function init() {
  if (!hasInit) {
    browser.tabs.onDetached.addListener(async () => { refreshUI("detached"); });
    browser.tabs.onAttached.addListener(async () => { refreshUI("attached"); });
    browser.tabs.onActivated.addListener(changeActive);
    browser.tabs.onCreated.addListener(addTab);
    browser.tabs.onRemoved.addListener(removeTab);
    hasInit = true;
  }
}

refreshUI("init");

document.addEventListener('DOMContentLoaded', init);
