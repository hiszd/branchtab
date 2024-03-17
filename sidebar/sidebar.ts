import browser from "webextension-polyfill";
import { selectOptions } from "../option-types";

let hasInit = false;

document.addEventListener('DOMContentLoaded', async () => {
  console.log("sidebar init");

  // NOTE: just for testing
  let b = await browser.tabs.query({ url: browser.runtime.getURL("sidebar/sidebar.html") })
  if (b.length <= 0) {
    browser.tabs.create({ url: browser.runtime.getURL("sidebar/sidebar.html") });
  }
  let o = await browser.tabs.query({ url: browser.runtime.getURL("options/options.html") })
  if (o.length <= 0) {
    browser.tabs.create({ url: browser.runtime.getURL("options/options.html") });
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
  #activeTab: { id: number, title: string } | undefined;
  #lastActiveTab: { id: number, title: string } | undefined;
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
  add = async (tab: Tab) => {
    this.#tabs.set(tab.id, tab);
    let newtabbehavior = await browser.storage.local.get('newtabbehavior');
    let activeTab: Tab;
    if (this.activeTab!.id === tab.id) {
      activeTab = this.get(this.#lastActiveTab!.id)!;
    } else {
      activeTab = this.get(this.activeTab!.id)!;
    }
    switch (newtabbehavior['newtabbehavior']) {
      case "0":
        tab.parentId = activeTab.id;
        break;
      case "1":
        tab.parentId = activeTab.parentId;
        break;
    }
    if (tab.parentId !== undefined) {
      let parent = this.get(tab.parentId!)!;
      parent.addChild(tab.id);
      console.log("added", tab.id, "to", parent.id);
    } else {
      this.#element.appendChild(tab.element);
      this.#tabs.set(tab.id, tab);
      console.log("added", tab.id, "to root");
    }
    this.#updateCache();
  }
  remove = (id: number) => {
    let tab = this.get(id)!;
    tab.remove();
    this.#tabs.delete(id);
  }
  get = (id: number) => {
    return this.#tabs.get(id);
  }
  has = (id: number) => {
    return this.#tabs.has(id);
  }
  winId = async () => {
    let win = await browser.windows.getCurrent()
    return win.id;
  };
  // NOTE: Getters and Setters
  get length() {
    return this.#tabs.size;
  }
  get activeTab() {
    return this.#activeTab;
  }
  set activeTab(val: { id: number, title: string } | undefined) {
    if (val) {
      let tab = this.get(val.id);
      if (tab) {
        this.#lastActiveTab = this.#activeTab;
        this.#activeTab = {
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
      } else {
        console.error("Setting activeTab not possible: Tab not found ", val);
      }
    }
  }
  // NOTE: listener callbacks
  created = async (tab: browser.Tabs.Tab) => {
    let tb = new Tab(tab.id!, tab.title!);
    if (tab.active) {
      tb.changeActive(true);
      await this.add(tb);
      this.activeTab = {
        id: tab.id!,
        title: tab.title!,
      }
    }
    console.log("Created and active: ", tab.id, tab.title);
  }
  removed = (tabId: number, removeInfo: browser.Tabs.OnRemovedRemoveInfoType) => {
    let tab = this.get(tabId);
    if (tab !== undefined) {
      this.remove(tabId);
      tab.remove();
    }
  }
  activated = (activeInfo: browser.Tabs.OnActivatedActiveInfoType) => {
    if (activeInfo.tabId) {
      console.log("Activated: ", activeInfo.tabId);
      let tab = this.get(activeInfo.tabId)!;
      this.activeTab = {
        id: tab.id,
        title: tab.title,
      }
    }
  }
}

class Tab {
  id: number;
  title: string;
  parentId: number | undefined;
  activeTab: { id: number, title: string } | undefined;
  #element: HTMLDivElement = document.createElement('div');
  #spacerEl: HTMLDivElement = document.createElement('div');
  #titleEl: HTMLDivElement = document.createElement('div');
  #childrenEl: HTMLDivElement = document.createElement('div');
  #children: number[] = [];
  #childrenLast: number[] = [];
  constructor(id: number, title: string, parentId?: number) {
    this.id = id;
    this.title = title;
    this.parentId = parentId || undefined;
    TABS.winId().then(winId_local => {
      browser.tabs.onUpdated.addListener(this.#updateElement, { tabId: this.id, windowId: winId_local, properties: ['title'] });
    });
    this.#updateElement();
  }
  // NOTE: PRIVATE Methods
  // WARN: this updates the whole element as of now. Might change to seperate update methods for title, children, etc.
  #updateElement = () => {
    console.log("Tab#updateElement", this.id);
    this.#element.innerHTML = "";
    this.#element.id = "p" + this.id.toString();
    this.#element.classList.add('tab');
    this.#element.onclick = () => {
      console.log("clicked");
      console.log(this.id, (this.#children.length > 0) ? ("has children: " + this.#children) : "does not have children");
      // browser.tabs.update(this.id, { active: true });
    };
    let wrapper = document.createElement('div');
    wrapper.classList.add('labelwrapper');

    let spcrcontents = document.querySelector('#arrow')?.innerHTML;
    this.#spacerEl.classList.add('spacer');
    this.#spacerEl.innerHTML = spcrcontents!;

    this.#titleEl.classList.add('label');
    this.#titleEl.textContent = this.title;

    this.#childrenEl.classList.add('children');
    if (this.#children !== this.#childrenLast) {
      this.#children.forEach((e) => {
        if (TABS.has(e)) {
          this.#childrenEl.appendChild(TABS.get(e)!.element);
        }
      });
      this.#childrenLast = this.#children;
    } else {
      console.log("same children", this.#children, this.#childrenLast);
    }

    if (this.parentId) {
      wrapper.appendChild(this.#spacerEl);
    }
    wrapper.appendChild(this.#titleEl);
    this.#element.appendChild(wrapper);
    this.#element.appendChild(this.#childrenEl);
  }
  // NOTE: PUBLIC Methods
  get element() {
    console.log("Tab#element", this.id);
    return this.#element;
  }
  remove = () => {
    this.#element.remove();
    if (this.parentId) {
      TABS.get(this.parentId)!.removeChild(this.id);
    }
    this.#updateElement();
  }
  addChild = (tabId: number) => {
    this.#children.push(tabId);
    this.#updateElement();
    console.log("Added child: ", tabId, "to", this.id);
  }
  removeChild = (tabId: number) => {
    this.#children = this.#children.filter((e) => e !== tabId);
    this.#updateElement();
    console.log("Removed child: ", tabId, "from", this.id);
  }
  getChild = (id: number) => {
    return this.#children.find((e) => e === id);
  }
  changeActive = (b: boolean) => {
    if (b) {
      this.#element.classList.add('active');
    } else {
      this.#element.classList.remove('active');
    }
  }
}

let TABS = new TabMap();
