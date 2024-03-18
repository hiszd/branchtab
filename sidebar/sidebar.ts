import browser from "webextension-polyfill";

interface TabEssence {
  id: number;
  title: string;
  url: string;
  parentUrl: string | undefined;
}

let hasInit = false;

document.addEventListener('DOMContentLoaded', async () => {
  console.log("sidebar init");

  // NOTE: just for testing
  const b = await browser.tabs.query({ url: browser.runtime.getURL("sidebar/sidebar.html") })
  if (b.length <= 0) {
    browser.tabs.create({ url: browser.runtime.getURL("sidebar/sidebar.html") });
  }
  const o = await browser.tabs.query({ url: browser.runtime.getURL("options/options.html") })
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
  winId = browser.windows.WINDOW_ID_CURRENT;
  // TODO: the cache needs to be loaded, compared with existing tabs, set parents of these tabs, THEN render the UI
  constructor() {
    this.#storageKey = "tabs-" + this.winId.toString();
    this.#getCache().then(e => {
      browser.tabs.query({ active: true, currentWindow: true }).then(r => {
        if (r.length > 0) {
          this.activeTab = {
            id: r[0].id!,
            title: r[0].title!,
          }
        }
      });
      if (e) {
        browser.windows.getCurrent({ populate: true }).then(w => {
          e.forEach((tab) => {
            // NOTE: find the tab in the window based on the url
            // WARN: not sure if the ID of the window is the same after restart
            let umatch = w.tabs!.find(t => t.url === tab.url);
            if (umatch) {
              let parent = w.tabs!.find(t => t.url === tab.parentUrl);
              this.#tabs.set(umatch.id!, new Tab(umatch.id!, umatch.title!, umatch.url!, parent?.id!));
            }
          });
          this.#updateCache();
          this.#initUI();
        });
      } else {
        browser.windows.getCurrent({ populate: true }).then((win) => {
          win.tabs!.forEach((tab) => {
            const tb = new Tab(tab.id!, tab.title!, tab.url!);
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
    let tabEssences: TabEssence[] = [];
    for (const value of this.#tabs.values()) {
      tabEssences.push(value.distillEssence());
    }
    const cache = { [this.#storageKey]: JSON.stringify(tabEssences) };
    console.log("set cache: ", cache);
    browser.storage.local.set(cache).catch(e => {
      console.error("cache error: ", e);
    });
  }
  #getCache = async (): Promise<TabEssence[] | undefined> => {
    const b = await browser.storage.local.get(null);
    if (b[this.#storageKey] === undefined) {
      return undefined;
    }
    const cache = JSON.parse(b[this.#storageKey]);
    console.log("get cache: ", cache);
    return cache;
  }
  #initUI = () => {
    this.#element.innerHTML = '';
    this.#tabs.forEach((tab) => {
      if (tab.parentId !== undefined) {
        const parent = this.#tabs.get(tab.parentId);
        if (parent !== undefined) {
          console.error("Parent not found: ", tab.id, parent.id);
        }
        parent!.addChild(tab.id);
      }
      this.#element.appendChild(tab.element);
    });
  }
  // NOTE: PUBLIC Methods
  add = async (tab: Tab) => {
    this.#tabs.set(tab.id, tab);
    const newtabbehavior = await browser.storage.local.get('newtabbehavior');
    let activeTab: Tab;
    if (this.activeTab && this.activeTab.id === tab.id) {
      if (this.#lastActiveTab) {
        activeTab = this.get(this.#lastActiveTab.id)!;
      } else {
        return;
      }
    } else {
      if (this.activeTab) {
        activeTab = this.get(this.activeTab.id)!;
      } else {
        return;
      }
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
      const parent = this.get(tab.parentId!)!;
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
    const tab = this.get(id)!;
    tab.remove();
    this.#tabs.delete(id);
    this.#updateCache();
  }
  get = (id: number) => {
    return this.#tabs.get(id);
  }
  has = (id: number) => {
    return this.#tabs.has(id);
  }
  // NOTE: Getters and Setters
  get length() {
    return this.#tabs.size;
  }
  get activeTab() {
    return this.#activeTab;
  }
  set activeTab(val: { id: number, title: string } | undefined) {
    if (val) {
      const tab = this.get(val.id);
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
    const tb = new Tab(tab.id!, tab.title!, tab.url!);
    if (tab.active) {
      tb.changeActive(true);
      await this.add(tb);
      this.activeTab = {
        id: tab.id!,
        title: tab.title!,
      }
    }
  }
  removed = (tabId: number, removeInfo: browser.Tabs.OnRemovedRemoveInfoType) => {
    const tab = this.get(tabId);
    if (tab !== undefined) {
      this.remove(tabId);
      tab.remove();
    }
  }
  activated = (activeInfo: browser.Tabs.OnActivatedActiveInfoType) => {
    if (activeInfo.tabId) {
      const tab = this.get(activeInfo.tabId)!;
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
  url: string;
  #element: HTMLDivElement = document.createElement('div');
  #wrapperEl: HTMLDivElement = document.createElement('div');
  #spacerEl: HTMLDivElement = document.createElement('div');
  #titleEl: HTMLDivElement = document.createElement('div');
  #childrenEl: HTMLDivElement = document.createElement('div');
  #children: number[] = [];
  #childrenLast: number[] = [];
  constructor(id: number, title: string, url: string, parentId?: number) {
    this.id = id;
    this.title = title;
    this.parentId = parentId || undefined;
    this.url = url;
    browser.tabs.onUpdated.addListener(this.#updated, { tabId: this.id, windowId: browser.windows.WINDOW_ID_CURRENT, properties: ["title", "url"] });
    this.#updateElement();
    this.#updateTitleElement();
    this.#updateChildrenElement();
  }
  // NOTE: PRIVATE Methods
  #updateElement = () => {
    this.#element.innerHTML = "";
    this.#element.id = "p" + this.id.toString();
    this.#element.classList.add('tab');
    this.#element.onclick = () => {
      console.log(this.id, (this.#children.length > 0) ? ("has children: " + this.#children) : "does not have children");
      // browser.tabs.update(this.id, { active: true });
    };
    this.#wrapperEl.classList.add('labelwrapper');

    const spcrcontents = document.querySelector('#arrow')?.innerHTML;
    this.#spacerEl.classList.add('spacer');
    this.#spacerEl.innerHTML = spcrcontents!;

    if (this.parentId) {
      this.#wrapperEl.appendChild(this.#spacerEl);
    }
    this.#wrapperEl.appendChild(this.#titleEl);

    this.#element.appendChild(this.#wrapperEl);
    this.#element.appendChild(this.#childrenEl);
  }
  #updateChildrenElement = () => {
    this.#childrenEl.classList.add('children');
    if (this.#children !== this.#childrenLast) {
      console.log("new children", this.#children, this.#childrenLast);
    } else {
      console.log("same children", this.#children, this.#childrenLast);
    }
    this.#children.forEach((e) => {
      const tab = TABS.get(e);
      if (tab) {
        this.#childrenEl.appendChild(tab.element);
      }
    });
    this.#childrenLast = this.#children;
  }
  #updateTitleElement = () => {
    this.#titleEl.classList.add('label');
    this.#titleEl.textContent = this.title;
  }
  // NOTE: PUBLIC Methods
  get element() {
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
    if (this.#children.includes(tabId)) {
      return;
    }
    this.#children.push(tabId);
    this.#updateChildrenElement();
    console.log("Added child: ", tabId, "to", this.id);
  }
  removeChild = (tabId: number) => {
    if (!this.#children.includes(tabId)) {
      return;
    }
    this.#children = this.#children.filter((e) => e !== tabId);
    this.#updateChildrenElement();
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
  distillEssence = (): TabEssence => {
    return {
      id: this.id,
      title: this.title,
      url: this.url,
      parentUrl: this.parentId ? TABS.get(this.parentId)!.url : undefined,
    }
  }
  // NOTE: Listeners
  #updated = (tabId: number, changeInfo: browser.Tabs.OnUpdatedChangeInfoType, tab: browser.Tabs.Tab) => {
    if (changeInfo.title) {
      console.log("tab updated", tabId, changeInfo.title);
      this.title = tab.title!;
      this.#updateTitleElement();
    }
    if (changeInfo.url) {
      console.log("tab updated", tabId, changeInfo.url);
      this.url = tab.url!;
    }
  }
}

const TABS = new TabMap();
