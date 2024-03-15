import browser from "webextension-polyfill";

let hasInit = false;

// NOTE: just for testing
document.addEventListener('DOMContentLoaded', async () => {
  console.log("sidebar init");
  let b = await browser.tabs.query({ url: browser.runtime.getURL("sidebar/sidebar.html") })
  if (b.length <= 0) {
    browser.tabs.create({ url: browser.runtime.getURL("sidebar/sidebar.html") });
  }
  if (!hasInit) {
    browser.tabs.onActivated.addListener(TABS.activated);
    browser.tabs.onCreated.addListener(TABS.created);
    browser.tabs.onRemoved.addListener(TABS.removed);
    hasInit = true;
  }
});

class TabMap {
  #tabs: Map<number, Tab> = new Map();
  #storageKey: string = '';
  activeTab: { id: number, title: string } | undefined;
  #element: HTMLDivElement = document.querySelector('#sidebar')!;
  constructor() {
    this.winId().then(e => {
      this.#storageKey = "tabs-" + e;
    });
    this.#getCache().then(e => {
      if (e[this.#storageKey]) {
        this.#tabs = e[this.#storageKey];
      } else {
        browser.windows.getCurrent({ populate: true }).then((win) => {
          win.tabs!.forEach((tab) => {
            let tb = new Tab(tab.id!, tab.title!);
            if (tab.active) {
              this.activeTab = {
                id: tab.id!,
                title: tab.title!,
              }
              tb.changeActive(true);
            }
            this.#tabs.set(tab.id!, tb);
          });
          this.#updateCache();
          this.#initUI();
        });
      }
    });
  }
  // NOTE: PRIVATE Methods
  #updateCache = () => {
    browser.storage.local.set({ [this.#storageKey]: this.#tabs });
  }
  #getCache = async () => {
    let b = await browser.storage.local.get(this.#storageKey);
    console.log("cache: ", b);
    return b;
  }
  #initUI = () => {
    this.#element.innerHTML = '';
    this.#tabs.forEach((tab) => {
      this.#element.appendChild(tab.element);
    });
  }
  // NOTE: PUBLIC Methods
  add = (tab: Tab) => {
    this.#element.appendChild(tab.element);
    this.#tabs.set(tab.id, tab);
    this.#updateCache();
  }
  remove = (id: number) => {
    let tab = this.get(id)!;
    tab.element.remove();
    this.#tabs.delete(id);
  }
  get = (id: number) => {
    return this.#tabs.get(id);
  }
  has = (id: number) => {
    return this.#tabs.has(id);
  }
  get length() {
    return this.#tabs.size;
  }
  winId = async () => {
    let win = await browser.windows.getCurrent()
    return win.id;
  };
  // NOTE: listener callbacks
  created = (tab: browser.Tabs.Tab) => {
    let tb = new Tab(tab.id!, tab.title!);
    this.add(tb);
  }
  removed = (tabId: number, removeInfo: browser.Tabs.OnRemovedRemoveInfoType) => {
    if (this.get(tabId)) {
      this.remove(tabId);
    }
  }
  activated = (activeInfo: browser.Tabs.OnActivatedActiveInfoType) => {
    if (activeInfo.tabId) {
      let tab = this.get(activeInfo.tabId)!;
      this.activeTab = {
        id: tab.id,
        title: tab.title,
      }
      this.#tabs.forEach((tb) => {
        if (tb.id == tab.id) {
          tb.changeActive(true);
        } else {
          tb.changeActive(false);
        }
      });
    }
  }
}

class Tab {
  id: number;
  title: string;
  parentId: number | undefined;
  children: number[] = [];
  #element: HTMLDivElement = document.createElement('div');
  #spacer: HTMLDivElement = document.createElement('div');
  #title: HTMLDivElement = document.createElement('div');
  #children: HTMLDivElement = document.createElement('div');
  constructor(id: number, title: string, parentId?: number) {
    this.id = id;
    this.title = title;
    this.parentId = parentId || undefined;
    TABS.winId().then(winId_local => {
      browser.tabs.onUpdated.addListener(this.#updateElement, { tabId: this.id, windowId: winId_local, properties: ['title'] });
    });
  }
  // NOTE: PRIVATE Methods
  // WARN: this updates the whole element as of now. Might change to seperate update methods for title, children, etc.
  #updateElement = () => {
    this.#element.id = "p" + this.id.toString();
    this.#element.className = "tab";
    this.#element.onclick = () => {
      console.log("clicked");
      console.log(this.id, (this.children.length > 0) ? ("has children: " + this.children) : "does not have children");
      // browser.tabs.update(this.id, { active: true });
    };
    let wrapper = document.createElement('div');
    wrapper.className = 'labelwrapper';

    let spcrcontents = document.querySelector('#arrow')?.innerHTML;
    this.#spacer.className = 'spacer';
    this.#spacer.innerHTML = spcrcontents!;

    this.#title.className = 'label';
    this.#title.textContent = this.title;

    this.#children.className = 'children';
    this.children.forEach((e) => {
      if (TABS.has(e)) {
        this.#children.appendChild(TABS.get(e)!.element);
      }
    });

    if (this.parentId) {
      wrapper.appendChild(this.#spacer);
    }
    wrapper.appendChild(this.#title);
    this.#element.appendChild(wrapper);
    this.#element.appendChild(this.#children);
  }
  // NOTE: PUBLIC Methods
  get element() {
    this.#updateElement();
    return this.#element;
  }
  addChild = (tabId: number) => {
    // NOTE: adds the item from this.children, but not to the DOM
    this.children.push(tabId);
  }
  removeChild = (tabId: number) => {
    // NOTE: removes the item from this.children, but not from the DOM
    this.children = this.children.filter((e) => e !== tabId);
  }
  getChild = (id: number) => {
    return this.children.find((e) => e === id);
  }
  changeActive = (b: boolean) => {
    if (b) {
      this.#element.classList.add('active');
      console.log("active: ", this.#element);
    } else {
      this.#element.classList.remove('active');
      console.log("inactive active: ", this.#element);
    }
  }
}

let TABS = new TabMap();
