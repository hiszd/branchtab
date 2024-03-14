"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var webextension_polyfill_1 = require("webextension-polyfill");
var winId;
webextension_polyfill_1.default.windows.getCurrent().then(function (win) {
    winId = win.id;
});
var activeTab = undefined;
var TabArray = /** @class */ (function () {
    function TabArray(children) {
        this.children = children || [];
    }
    TabArray.prototype.add = function (tab) {
        this.children.push(tab);
    };
    TabArray.prototype.remove = function (tabId) {
        var t = this.get(tabId);
        if (t) {
            t.element.remove();
            this.children = this.children.filter(function (e) { return e.id !== tabId; });
        }
        else {
            console.log("tab not found: ", tabId);
        }
    };
    TabArray.prototype.get = function (id) {
        return this.children.find(function (e) { return e.id === id; });
    };
    return TabArray;
}());
var Tab = /** @class */ (function () {
    function Tab(id, title, parent, children) {
        this.id = id;
        this.title = title;
        this.parent = parent;
        this.children = children || [];
        this.updateElement = this.updateElement.bind(this);
        webextension_polyfill_1.default.tabs.onUpdated.addListener(this.updateElement, { tabId: this.id, windowId: winId, properties: ['title'] });
    }
    Object.defineProperty(Tab.prototype, "element", {
        get: function () {
            var _this = this;
            if (this._element) {
                return this._element;
            }
            else {
                var wrapper = document.createElement('div');
                wrapper.id = this.id.toString();
                var label = document.createElement('div');
                label.className = 'label';
                label.textContent = this.title;
                var children_1 = document.createElement('div');
                children_1.className = 'children';
                this.children.forEach(function (e) {
                    if (tabs) {
                        var t = tabs.get(e);
                        if (t) {
                            children_1.appendChild(t.element);
                        }
                    }
                });
                if (this.id === (activeTab === null || activeTab === void 0 ? void 0 : activeTab.id)) {
                    wrapper.className = 'tab active';
                }
                else {
                    wrapper.className = 'tab';
                }
                wrapper.appendChild(label);
                wrapper.appendChild(children_1);
                wrapper.addEventListener('click', function () {
                    webextension_polyfill_1.default.tabs.update(_this.id, { active: true });
                });
                this._element = wrapper;
                return wrapper;
            }
        },
        enumerable: false,
        configurable: true
    });
    Tab.prototype.updateElement = function (_tabId, changeInfo) {
        if (changeInfo.title) {
            this.title = changeInfo.title;
            this.element.textContent = this.title;
        }
    };
    Tab.prototype.addChild = function (tabId) {
        this.children.push(tabId);
    };
    Tab.prototype.removeChild = function (tabId) {
        if (this.getChild(tabId)) {
            this.children = this.children.filter(function (e) { return e !== tabId; });
        }
    };
    Tab.prototype.getChild = function (id) {
        return this.children.find(function (e) { return e === id; });
    };
    return Tab;
}());
var parentEl = document.querySelector('#sidebar');
var previouslyActiveTab = undefined;
var tabs = new TabArray([]);
function refreshUI() {
    webextension_polyfill_1.default.tabs.query({ active: true, windowId: winId }).then(function (at) {
        previouslyActiveTab = activeTab;
        activeTab = {
            id: at[0].id,
            title: at[0].title,
        };
    });
    webextension_polyfill_1.default.tabs.query({ windowId: winId }).then(function (tbs) {
        tabs = new TabArray(tbs.map(function (tab) { return new Tab(tab.id, tab.title, undefined, []); }));
        parentEl.innerHTML = '';
        for (var _i = 0, _a = tabs.children; _i < _a.length; _i++) {
            var tab = _a[_i];
            if (tab.parent === undefined) {
                var el = tab.element;
                parentEl.appendChild(el);
            }
        }
    });
}
function changeActive(activeInfo) {
    var tabId = activeInfo.tabId, previousTabId = activeInfo.previousTabId, windowId = activeInfo.windowId;
    if (windowId !== winId) {
        return;
    }
    var comp = {
        atid: activeTab.id,
        paid: previouslyActiveTab === null || previouslyActiveTab === void 0 ? void 0 : previouslyActiveTab.id,
        tid: tabId,
        ptid: previousTabId,
    };
    if (activeTab.id !== previousTabId) {
        if (activeTab.id === tabId) {
            console.log("Weird.... ", comp);
        }
        else {
            console.log("failure and disappointment", comp);
        }
    }
    previouslyActiveTab = activeTab;
    webextension_polyfill_1.default.tabs.get(tabId).then(function (tb) {
        activeTab = {
            id: tb.id,
            title: tb.title,
        };
    }).catch(function (e) {
        console.error(e);
    });
    tabs = new TabArray(tabs.children.map(function (e) { e.element.className = 'tab'; return e; }));
    var t = tabs.get(tabId);
    if (t) {
        t.element.className = 'tab active';
    }
}
/**
  * @param {number} id
  */
function getTab(id) {
    var tab = tabs.get(id);
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
    var parent = undefined;
    if (activeTab !== undefined) {
        if (activeTab.id !== tab.id) {
            parent = tabs.get(activeTab.id);
            console.log("adding tab: ", tab.id, tab.title);
            console.log("with parent: ", parent.id, parent.title);
            var tb = new Tab(tab.id, tab.title, parent.id, []);
            parent.addChild(tb.id);
        }
        else {
            if (previouslyActiveTab !== undefined) {
                parent = tabs.get(previouslyActiveTab.id);
                console.log("adding tab", tab.id, tab.title);
                console.log("with parent: ", parent.id, parent.title);
                var tb = new Tab(tab.id, tab.title, parent.id, []);
                tabs.add(tb);
                parentEl.appendChild(tb.element);
            }
        }
    }
    else {
        console.log("not sure here");
    }
    tabs.add(new Tab(tab.id, tab.title, undefined, []));
}
function removeTab(tabId, removeInfo) {
    var windowId = removeInfo.windowId;
    if (windowId === winId) {
        var el = parentEl.querySelector('#' + tabId);
        console.log("removing tab ".concat(tabId, " ").concat(el.innerHTML));
        tabs.remove(tabId);
    }
}
var hasInit = false;
// called when the DOM is loaded
function init() {
    if (!hasInit) {
        webextension_polyfill_1.default.tabs.onDetached.addListener(refreshUI);
        webextension_polyfill_1.default.tabs.onAttached.addListener(refreshUI);
        webextension_polyfill_1.default.tabs.onActivated.addListener(changeActive);
        webextension_polyfill_1.default.tabs.onCreated.addListener(addTab);
        webextension_polyfill_1.default.tabs.onRemoved.addListener(removeTab);
        hasInit = true;
    }
}
refreshUI();
document.addEventListener('DOMContentLoaded', init);
