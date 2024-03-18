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
  // const b = await browser.tabs.query({ url: browser.runtime.getURL("sidebar/sidebar.html") })
  // if (b.length <= 0) {
  //   browser.tabs.create({ url: browser.runtime.getURL("sidebar/sidebar.html") });
  // }
  // const o = await browser.tabs.query({ url: browser.runtime.getURL("options/options.html") })
  // if (o.length <= 0) {
  //   browser.tabs.create({ url: browser.runtime.getURL("options/options.html") });
  // }

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
  winId: number | undefined;
  // TODO: WIP the cache needs to be loaded, compared with existing tabs, set parents of these tabs, THEN render the UI
  constructor() {
    browser.windows.getCurrent().then(w => {
      this.winId = w.id!;
      this.#storageKey = "tabs-" + w.id!;
      browser.tabs.onUpdated.addListener(this.#onUpdated, { windowId: this.winId });
    });
    this.#retrieveTabs().then(e => {
      if (e) {
        e.forEach(t => {
          TABS.add(t);
        });
        this.#initUI();
      }
    });
  }
  // NOTE: PRIVATE Methods
  // WARN: might need to setup queues for tab updates, or adding, removing, etc.
  #retrieveTabs = async (): Promise<Tab[] | undefined> => {
    const winDat = await browser.windows.getCurrent({ populate: true });
    const cache = await this.#getCache();
    const tabs = winDat.tabs!;
    let rtrn: Tab[] = [];
    if (this.#tabs.size > 0) {
      console.error("tabs already exist, not retrieving tabs.");
      return undefined;
    }
    cache?.forEach(tab => {
      const ft = tabs.find(t => t.url === tab.url);
      if (ft) {
        if (!tab.parentUrl) {
          const tb = new Tab(ft.id!, ft.title!, ft.url!, undefined);
          if (ft.active) {
            tb.changeActive(true);
            this.activeTab = {
              id: tb.id!,
              title: tb.title!,
            }
          }
          rtrn.push(tb);
        } else {
          let parent = tabs.find(t => t.url === tab.parentUrl);
          if (parent) {
            const tb = new Tab(ft.id!, ft.title!, ft.url!, parent.id);
            if (ft.active) {
              tb.changeActive(true);
              this.activeTab = {
                id: tb.id!,
                title: tb.title!,
              }
            }
            rtrn.push(tb);
          }
        }
      }
    });
    tabs.forEach(tab => {
      const ft = rtrn.find(t => t.url === tab.url);
      if (!ft) {
        const tb = new Tab(tab.id!, tab.title!, tab.url!, undefined);
        if (tab.active) {
          tb.changeActive(true);
          this.activeTab = {
            id: tb.id!,
            title: tb.title!,
          }
        }
        rtrn.push(tb);
      }
    })
    return rtrn;
  }
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
  #onUpdated = (tabId: number, changeInfo: browser.Tabs.OnUpdatedChangeInfoType, tab: browser.Tabs.Tab) => {
    if (this.#tabs.has(tabId)) {
      this.#updateCache();
    }
  }
  // NOTE: PUBLIC Methods
  add = async (tab: Tab) => {
    this.#tabs.set(tab.id, tab);
    const newtabbehavior = await browser.storage.local.get('newtabbehavior');
    console.log("start", "activeTab: ", this.activeTab, "lastActiveTab: ", this.#lastActiveTab);
    // FIXME: need to figure out why the tabs aren't getting added as children
    if (tab.parentId === undefined) {
      let activeTab: Tab | undefined;
      if (this.activeTab && this.activeTab.id === tab.id) {
        if (this.#lastActiveTab) {
          activeTab = this.get(this.#lastActiveTab.id)!;
        } else {
          console.log("early return 1");
          return;
        }
      } else {
        if (this.activeTab) {
          activeTab = this.get(this.activeTab.id)!;
        } else {
          if (tab.isActive) {
            activeTab = undefined;
            this.activeTab = {
              id: tab.id!,
              title: tab.title!,
            }
          } else {
            console.log("early return 2");
            return;
          }
        }
      }
      switch (newtabbehavior['newtabbehavior']) {
        case "0":
          tab.parentId = activeTab?.id;
          break;
        case "1":
          tab.parentId = activeTab?.parentId;
          break;
      }
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
    console.log("end", "activeTab: ", this.activeTab, "lastActiveTab: ", this.#lastActiveTab);
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
      console.log("active tab created", tab);
      tb.changeActive(true);
      await this.add(tb);
      this.activeTab = {
        id: tab.id!,
        title: tab.title!,
      }
    } else {
      console.log("normal tab created", tab);
      this.add(tb);
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
      const tab = this.get(activeInfo.tabId);
      if (tab) {
        this.activeTab = {
          id: tab.id,
          title: tab.title,
        }
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
  isActive: boolean = false;
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
      this.isActive = true;
      this.#element.classList.add('active');
    } else {
      this.isActive = false;
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
