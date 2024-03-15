import browser from "webextension-polyfill";

let winId = async () => {
  let win = await browser.windows.getCurrent()
  return win.id;
};

let activeTab: { id: number; title: string; } | undefined = undefined;

class TabArray {
  constructor(children: Tab[]) {
    this.children = children || [];
  }
  children: Tab[];
  add(tab: Tab) {
    this.children.push(tab);
  }
  remove(tabId: number) {
    let t = this.get(tabId);
    if (t) {
      t.element.remove();
      this.children = this.children.filter((e) => e.id !== tabId);
    } else {
      console.log("tab not found: ", tabId);
    }
  }
  get(id: number) {
    return this.children.find((e) => e.id === id);
  }
}

class Tab {
  constructor(id: number, title: string, parent: number | undefined, children: number[]) {
    this.id = id;
    this.title = title;
    this.parent = parent;
    this.children = children || [];
    this.updateElement = this.updateElement.bind(this);
    this.updateChildren = this.updateChildren.bind(this);
    this.getChildrenElement = this.getChildrenElement.bind(this);
    this.addChild = this.addChild.bind(this);
    this.getChild = this.getChild.bind(this);
    this.removeChild = this.removeChild.bind(this);
    winId().then(winId_local => {
      browser.tabs.onUpdated.addListener(this.updateElement, { tabId: this.id, windowId: winId_local, properties: ['title'] });
    });
  }
  id: number;
  title: string;
  parent: number | undefined;
  children: number[];
  _element: HTMLDivElement | undefined;
  get element(): HTMLDivElement {
    if (this._element) {
      return this._element;
    } else {
      let wrapper = document.createElement('div');
      wrapper.id = "p" + this.id.toString();
      let label = document.createElement('div');
      label.className = 'label';
      label.textContent = this.title;
      let children = this.getChildrenElement();
      if (this.id === activeTab?.id) {
        wrapper.className = 'tab active';
      } else {
        wrapper.className = 'tab';
      }
      wrapper.appendChild(label);
      wrapper.appendChild(children);
      wrapper.addEventListener('click', () => {
        console.log("click", this.id);
        console.log(this.children);
        // browser.tabs.update(this.id, { active: true });
      });
      this._element = wrapper;
      return wrapper;
    }
  }
  getChildrenElement(): HTMLDivElement {
    let children = document.createElement('div');
    children.className = 'children';
    this.children.forEach((e) => {
      if (tabs) {
        let t = tabs.get(e);
        if (t) {
          children.appendChild(t.element);
        }
      }
    });
    return children;
  }
  updateChildren() {
    if (this._element) {
      this._element.replaceChild(this.getChildrenElement(), this._element.querySelector('.children')!);
    } else {
      console.error("No element found: ", this.id);
    }
  }
  updateElement(_tabId: number, changeInfo: browser.Tabs.OnUpdatedChangeInfoType) {
    if (changeInfo.title) {
      this.title = changeInfo.title;
      this.element.textContent = this.title;
    }
  }
  addChild(tabId: number) {
    console.log("adding child", tabId);
    this.children.push(tabId);
    this.updateChildren();
  }
  removeChild(tabId: number) {
    if (this.getChild(tabId)) {
      console.log("removing child", tabId);
      this.children = this.children.filter((e) => e !== tabId);
      this.updateChildren();
    }
  }
  getChild(id: number): number | undefined {
    return this.children.find((e) => e === id);
  }
}

let parentEl = document.querySelector('#sidebar');

let previouslyActiveTab: { id: number; title: string; } | undefined = undefined;

let tabs: TabArray = new TabArray([]);

async function refreshUI() {
  browser.tabs.query({ active: true, windowId: await winId() }).then(at => {
    previouslyActiveTab = activeTab;
    activeTab = {
      id: at[0].id!,
      title: at[0].title!,
    };
  });
  browser.tabs.query({ windowId: await winId() }).then(tbs => {
    tabs = new TabArray(tbs.map(tab => new Tab(tab.id!, tab.title!, undefined, [])));
    parentEl!.innerHTML = '';
    for (let tab of tabs.children) {
      if (tab.parent === undefined) {
        let el = tab.element;
        parentEl!.appendChild(el);
      }
    }
  });
}

async function changeActive(activeInfo: browser.Tabs.OnActivatedActiveInfoType) {
  let { tabId, previousTabId, windowId } = activeInfo;
  if (windowId !== await winId()) {
    return;
  }
  let comp = {
    atid: activeTab!.id,
    paid: previouslyActiveTab?.id,
    tid: tabId,
    ptid: previousTabId,
  }
  if (activeTab!.id !== previousTabId) {
    if (activeTab!.id === tabId) {
      console.log("Weird.... ", comp);
    } else {
      console.log("failure and disappointment", comp);
    }
  }
  previouslyActiveTab = activeTab;
  browser.tabs.get(tabId).then(tb => {
    activeTab = {
      id: tb.id!,
      title: tb.title!,
    }
  }).catch(e => {
    console.error(e);
  });

  tabs = new TabArray(tabs.children.map(e => { e.element.className = 'tab'; return e; }));
  let t = tabs.get(tabId);
  if (t) {
    t.element.className = 'tab active';
  }
}

async function addTab(tab: browser.Tabs.Tab) {
  if (tab.windowId !== await winId()) {
    return;
  }
  console.log(activeTab, previouslyActiveTab);
  let parent: Tab | undefined = undefined;
  if (activeTab !== undefined) {
    if (activeTab.id !== tab.id) {
      parent = tabs.get(activeTab.id)!;
      console.log("adding tab: ", tab.id, tab.title);
      console.log("with parent: ", parent.id, parent.title);
      let tb = new Tab(tab.id!, tab.title!, parent.id, []);
      parent.addChild(tb.id);
    } else {
      if (previouslyActiveTab !== undefined) {
        parent = tabs.get(previouslyActiveTab.id)!;
        console.log("adding tab", tab.id, tab.title);
        console.log("with parent: ", parent.id, parent.title);
        let tb = new Tab(tab.id, tab.title!, parent.id, []);
        tabs.add(tb);
        parentEl!.appendChild(tb.element);
      }
    }
  } else {
    console.log("not sure here");
  }
  tabs.add(new Tab(tab.id!, tab.title!, undefined, []));
}

async function removeTab(tabId: number, removeInfo: browser.Tabs.OnRemovedRemoveInfoType) {
  let { windowId } = removeInfo;
  if (windowId === await winId()) {
    let el = parentEl!.querySelector('#' + tabId);
    if (el) {
      el.remove();
    } else {
      console.error("tab not found: ", tabId);
    }
    console.log(`removing tab ${tabId} ${el!.innerHTML}`);
    tabs.remove(tabId);
  }
}

let hasInit = false;

// called when the DOM is loaded
function init() {
  if (!hasInit) {
    browser.tabs.onDetached.addListener(refreshUI);
    browser.tabs.onAttached.addListener(refreshUI);
    browser.tabs.onActivated.addListener(changeActive);
    browser.tabs.onCreated.addListener(addTab);
    browser.tabs.onRemoved.addListener(removeTab);
    hasInit = true;
  }
}

refreshUI();

document.addEventListener('DOMContentLoaded', init);
