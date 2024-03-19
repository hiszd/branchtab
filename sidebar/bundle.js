(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define("webextension-polyfill", ["module"], factory);
  } else if (typeof exports !== "undefined") {
    factory(module);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod);
    global.browser = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (module) {
  /* webextension-polyfill - v0.10.0 - Fri Aug 12 2022 19:42:44 */

  /* -*- Mode: indent-tabs-mode: nil; js-indent-level: 2 -*- */

  /* vim: set sts=2 sw=2 et tw=80: */

  /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  "use strict";

  if (!globalThis.chrome?.runtime?.id) {
    throw new Error("This script should only be loaded in a browser extension.");
  }

  if (typeof globalThis.browser === "undefined" || Object.getPrototypeOf(globalThis.browser) !== Object.prototype) {
    const CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE = "The message port closed before a response was received."; // Wrapping the bulk of this polyfill in a one-time-use function is a minor
    // optimization for Firefox. Since Spidermonkey does not fully parse the
    // contents of a function until the first time it's called, and since it will
    // never actually need to be called, this allows the polyfill to be included
    // in Firefox nearly for free.

    const wrapAPIs = extensionAPIs => {
      // NOTE: apiMetadata is associated to the content of the api-metadata.json file
      // at build time by replacing the following "include" with the content of the
      // JSON file.
      const apiMetadata = {
        "alarms": {
          "clear": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "clearAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "get": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "bookmarks": {
          "create": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getChildren": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getRecent": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getSubTree": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getTree": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "move": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeTree": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "search": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        },
        "browserAction": {
          "disable": {
            "minArgs": 0,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "enable": {
            "minArgs": 0,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "getBadgeBackgroundColor": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getBadgeText": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getPopup": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getTitle": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "openPopup": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "setBadgeBackgroundColor": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setBadgeText": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setIcon": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "setPopup": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setTitle": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          }
        },
        "browsingData": {
          "remove": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "removeCache": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeCookies": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeDownloads": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeFormData": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeHistory": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeLocalStorage": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removePasswords": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removePluginData": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "settings": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "commands": {
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "contextMenus": {
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        },
        "cookies": {
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAllCookieStores": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "set": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "devtools": {
          "inspectedWindow": {
            "eval": {
              "minArgs": 1,
              "maxArgs": 2,
              "singleCallbackArg": false
            }
          },
          "panels": {
            "create": {
              "minArgs": 3,
              "maxArgs": 3,
              "singleCallbackArg": true
            },
            "elements": {
              "createSidebarPane": {
                "minArgs": 1,
                "maxArgs": 1
              }
            }
          }
        },
        "downloads": {
          "cancel": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "download": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "erase": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getFileIcon": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "open": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "pause": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeFile": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "resume": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "search": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "show": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          }
        },
        "extension": {
          "isAllowedFileSchemeAccess": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "isAllowedIncognitoAccess": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "history": {
          "addUrl": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "deleteAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "deleteRange": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "deleteUrl": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getVisits": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "search": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "i18n": {
          "detectLanguage": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAcceptLanguages": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "identity": {
          "launchWebAuthFlow": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "idle": {
          "queryState": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "management": {
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getSelf": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "setEnabled": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "uninstallSelf": {
            "minArgs": 0,
            "maxArgs": 1
          }
        },
        "notifications": {
          "clear": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "create": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getPermissionLevel": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        },
        "pageAction": {
          "getPopup": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getTitle": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "hide": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setIcon": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "setPopup": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setTitle": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "show": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          }
        },
        "permissions": {
          "contains": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "request": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "runtime": {
          "getBackgroundPage": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getPlatformInfo": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "openOptionsPage": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "requestUpdateCheck": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "sendMessage": {
            "minArgs": 1,
            "maxArgs": 3
          },
          "sendNativeMessage": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "setUninstallURL": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "sessions": {
          "getDevices": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getRecentlyClosed": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "restore": {
            "minArgs": 0,
            "maxArgs": 1
          }
        },
        "storage": {
          "local": {
            "clear": {
              "minArgs": 0,
              "maxArgs": 0
            },
            "get": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "getBytesInUse": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "remove": {
              "minArgs": 1,
              "maxArgs": 1
            },
            "set": {
              "minArgs": 1,
              "maxArgs": 1
            }
          },
          "managed": {
            "get": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "getBytesInUse": {
              "minArgs": 0,
              "maxArgs": 1
            }
          },
          "sync": {
            "clear": {
              "minArgs": 0,
              "maxArgs": 0
            },
            "get": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "getBytesInUse": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "remove": {
              "minArgs": 1,
              "maxArgs": 1
            },
            "set": {
              "minArgs": 1,
              "maxArgs": 1
            }
          }
        },
        "tabs": {
          "captureVisibleTab": {
            "minArgs": 0,
            "maxArgs": 2
          },
          "create": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "detectLanguage": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "discard": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "duplicate": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "executeScript": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getCurrent": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getZoom": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getZoomSettings": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "goBack": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "goForward": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "highlight": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "insertCSS": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "move": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "query": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "reload": {
            "minArgs": 0,
            "maxArgs": 2
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeCSS": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "sendMessage": {
            "minArgs": 2,
            "maxArgs": 3
          },
          "setZoom": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "setZoomSettings": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "update": {
            "minArgs": 1,
            "maxArgs": 2
          }
        },
        "topSites": {
          "get": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "webNavigation": {
          "getAllFrames": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getFrame": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "webRequest": {
          "handlerBehaviorChanged": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "windows": {
          "create": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "get": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getCurrent": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getLastFocused": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        }
      };

      if (Object.keys(apiMetadata).length === 0) {
        throw new Error("api-metadata.json has not been included in browser-polyfill");
      }
      /**
       * A WeakMap subclass which creates and stores a value for any key which does
       * not exist when accessed, but behaves exactly as an ordinary WeakMap
       * otherwise.
       *
       * @param {function} createItem
       *        A function which will be called in order to create the value for any
       *        key which does not exist, the first time it is accessed. The
       *        function receives, as its only argument, the key being created.
       */


      class DefaultWeakMap extends WeakMap {
        constructor(createItem, items = undefined) {
          super(items);
          this.createItem = createItem;
        }

        get(key) {
          if (!this.has(key)) {
            this.set(key, this.createItem(key));
          }

          return super.get(key);
        }

      }
      /**
       * Returns true if the given object is an object with a `then` method, and can
       * therefore be assumed to behave as a Promise.
       *
       * @param {*} value The value to test.
       * @returns {boolean} True if the value is thenable.
       */


      const isThenable = value => {
        return value && typeof value === "object" && typeof value.then === "function";
      };
      /**
       * Creates and returns a function which, when called, will resolve or reject
       * the given promise based on how it is called:
       *
       * - If, when called, `chrome.runtime.lastError` contains a non-null object,
       *   the promise is rejected with that value.
       * - If the function is called with exactly one argument, the promise is
       *   resolved to that value.
       * - Otherwise, the promise is resolved to an array containing all of the
       *   function's arguments.
       *
       * @param {object} promise
       *        An object containing the resolution and rejection functions of a
       *        promise.
       * @param {function} promise.resolve
       *        The promise's resolution function.
       * @param {function} promise.reject
       *        The promise's rejection function.
       * @param {object} metadata
       *        Metadata about the wrapped method which has created the callback.
       * @param {boolean} metadata.singleCallbackArg
       *        Whether or not the promise is resolved with only the first
       *        argument of the callback, alternatively an array of all the
       *        callback arguments is resolved. By default, if the callback
       *        function is invoked with only a single argument, that will be
       *        resolved to the promise, while all arguments will be resolved as
       *        an array if multiple are given.
       *
       * @returns {function}
       *        The generated callback function.
       */


      const makeCallback = (promise, metadata) => {
        return (...callbackArgs) => {
          if (extensionAPIs.runtime.lastError) {
            promise.reject(new Error(extensionAPIs.runtime.lastError.message));
          } else if (metadata.singleCallbackArg || callbackArgs.length <= 1 && metadata.singleCallbackArg !== false) {
            promise.resolve(callbackArgs[0]);
          } else {
            promise.resolve(callbackArgs);
          }
        };
      };

      const pluralizeArguments = numArgs => numArgs == 1 ? "argument" : "arguments";
      /**
       * Creates a wrapper function for a method with the given name and metadata.
       *
       * @param {string} name
       *        The name of the method which is being wrapped.
       * @param {object} metadata
       *        Metadata about the method being wrapped.
       * @param {integer} metadata.minArgs
       *        The minimum number of arguments which must be passed to the
       *        function. If called with fewer than this number of arguments, the
       *        wrapper will raise an exception.
       * @param {integer} metadata.maxArgs
       *        The maximum number of arguments which may be passed to the
       *        function. If called with more than this number of arguments, the
       *        wrapper will raise an exception.
       * @param {boolean} metadata.singleCallbackArg
       *        Whether or not the promise is resolved with only the first
       *        argument of the callback, alternatively an array of all the
       *        callback arguments is resolved. By default, if the callback
       *        function is invoked with only a single argument, that will be
       *        resolved to the promise, while all arguments will be resolved as
       *        an array if multiple are given.
       *
       * @returns {function(object, ...*)}
       *       The generated wrapper function.
       */


      const wrapAsyncFunction = (name, metadata) => {
        return function asyncFunctionWrapper(target, ...args) {
          if (args.length < metadata.minArgs) {
            throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
          }

          if (args.length > metadata.maxArgs) {
            throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
          }

          return new Promise((resolve, reject) => {
            if (metadata.fallbackToNoCallback) {
              // This API method has currently no callback on Chrome, but it return a promise on Firefox,
              // and so the polyfill will try to call it with a callback first, and it will fallback
              // to not passing the callback if the first call fails.
              try {
                target[name](...args, makeCallback({
                  resolve,
                  reject
                }, metadata));
              } catch (cbError) {
                console.warn(`${name} API method doesn't seem to support the callback parameter, ` + "falling back to call it without a callback: ", cbError);
                target[name](...args); // Update the API method metadata, so that the next API calls will not try to
                // use the unsupported callback anymore.

                metadata.fallbackToNoCallback = false;
                metadata.noCallback = true;
                resolve();
              }
            } else if (metadata.noCallback) {
              target[name](...args);
              resolve();
            } else {
              target[name](...args, makeCallback({
                resolve,
                reject
              }, metadata));
            }
          });
        };
      };
      /**
       * Wraps an existing method of the target object, so that calls to it are
       * intercepted by the given wrapper function. The wrapper function receives,
       * as its first argument, the original `target` object, followed by each of
       * the arguments passed to the original method.
       *
       * @param {object} target
       *        The original target object that the wrapped method belongs to.
       * @param {function} method
       *        The method being wrapped. This is used as the target of the Proxy
       *        object which is created to wrap the method.
       * @param {function} wrapper
       *        The wrapper function which is called in place of a direct invocation
       *        of the wrapped method.
       *
       * @returns {Proxy<function>}
       *        A Proxy object for the given method, which invokes the given wrapper
       *        method in its place.
       */


      const wrapMethod = (target, method, wrapper) => {
        return new Proxy(method, {
          apply(targetMethod, thisObj, args) {
            return wrapper.call(thisObj, target, ...args);
          }

        });
      };

      let hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);
      /**
       * Wraps an object in a Proxy which intercepts and wraps certain methods
       * based on the given `wrappers` and `metadata` objects.
       *
       * @param {object} target
       *        The target object to wrap.
       *
       * @param {object} [wrappers = {}]
       *        An object tree containing wrapper functions for special cases. Any
       *        function present in this object tree is called in place of the
       *        method in the same location in the `target` object tree. These
       *        wrapper methods are invoked as described in {@see wrapMethod}.
       *
       * @param {object} [metadata = {}]
       *        An object tree containing metadata used to automatically generate
       *        Promise-based wrapper functions for asynchronous. Any function in
       *        the `target` object tree which has a corresponding metadata object
       *        in the same location in the `metadata` tree is replaced with an
       *        automatically-generated wrapper function, as described in
       *        {@see wrapAsyncFunction}
       *
       * @returns {Proxy<object>}
       */

      const wrapObject = (target, wrappers = {}, metadata = {}) => {
        let cache = Object.create(null);
        let handlers = {
          has(proxyTarget, prop) {
            return prop in target || prop in cache;
          },

          get(proxyTarget, prop, receiver) {
            if (prop in cache) {
              return cache[prop];
            }

            if (!(prop in target)) {
              return undefined;
            }

            let value = target[prop];

            if (typeof value === "function") {
              // This is a method on the underlying object. Check if we need to do
              // any wrapping.
              if (typeof wrappers[prop] === "function") {
                // We have a special-case wrapper for this method.
                value = wrapMethod(target, target[prop], wrappers[prop]);
              } else if (hasOwnProperty(metadata, prop)) {
                // This is an async method that we have metadata for. Create a
                // Promise wrapper for it.
                let wrapper = wrapAsyncFunction(prop, metadata[prop]);
                value = wrapMethod(target, target[prop], wrapper);
              } else {
                // This is a method that we don't know or care about. Return the
                // original method, bound to the underlying object.
                value = value.bind(target);
              }
            } else if (typeof value === "object" && value !== null && (hasOwnProperty(wrappers, prop) || hasOwnProperty(metadata, prop))) {
              // This is an object that we need to do some wrapping for the children
              // of. Create a sub-object wrapper for it with the appropriate child
              // metadata.
              value = wrapObject(value, wrappers[prop], metadata[prop]);
            } else if (hasOwnProperty(metadata, "*")) {
              // Wrap all properties in * namespace.
              value = wrapObject(value, wrappers[prop], metadata["*"]);
            } else {
              // We don't need to do any wrapping for this property,
              // so just forward all access to the underlying object.
              Object.defineProperty(cache, prop, {
                configurable: true,
                enumerable: true,

                get() {
                  return target[prop];
                },

                set(value) {
                  target[prop] = value;
                }

              });
              return value;
            }

            cache[prop] = value;
            return value;
          },

          set(proxyTarget, prop, value, receiver) {
            if (prop in cache) {
              cache[prop] = value;
            } else {
              target[prop] = value;
            }

            return true;
          },

          defineProperty(proxyTarget, prop, desc) {
            return Reflect.defineProperty(cache, prop, desc);
          },

          deleteProperty(proxyTarget, prop) {
            return Reflect.deleteProperty(cache, prop);
          }

        }; // Per contract of the Proxy API, the "get" proxy handler must return the
        // original value of the target if that value is declared read-only and
        // non-configurable. For this reason, we create an object with the
        // prototype set to `target` instead of using `target` directly.
        // Otherwise we cannot return a custom object for APIs that
        // are declared read-only and non-configurable, such as `chrome.devtools`.
        //
        // The proxy handlers themselves will still use the original `target`
        // instead of the `proxyTarget`, so that the methods and properties are
        // dereferenced via the original targets.

        let proxyTarget = Object.create(target);
        return new Proxy(proxyTarget, handlers);
      };
      /**
       * Creates a set of wrapper functions for an event object, which handles
       * wrapping of listener functions that those messages are passed.
       *
       * A single wrapper is created for each listener function, and stored in a
       * map. Subsequent calls to `addListener`, `hasListener`, or `removeListener`
       * retrieve the original wrapper, so that  attempts to remove a
       * previously-added listener work as expected.
       *
       * @param {DefaultWeakMap<function, function>} wrapperMap
       *        A DefaultWeakMap object which will create the appropriate wrapper
       *        for a given listener function when one does not exist, and retrieve
       *        an existing one when it does.
       *
       * @returns {object}
       */


      const wrapEvent = wrapperMap => ({
        addListener(target, listener, ...args) {
          target.addListener(wrapperMap.get(listener), ...args);
        },

        hasListener(target, listener) {
          return target.hasListener(wrapperMap.get(listener));
        },

        removeListener(target, listener) {
          target.removeListener(wrapperMap.get(listener));
        }

      });

      const onRequestFinishedWrappers = new DefaultWeakMap(listener => {
        if (typeof listener !== "function") {
          return listener;
        }
        /**
         * Wraps an onRequestFinished listener function so that it will return a
         * `getContent()` property which returns a `Promise` rather than using a
         * callback API.
         *
         * @param {object} req
         *        The HAR entry object representing the network request.
         */


        return function onRequestFinished(req) {
          const wrappedReq = wrapObject(req, {}
          /* wrappers */
          , {
            getContent: {
              minArgs: 0,
              maxArgs: 0
            }
          });
          listener(wrappedReq);
        };
      });
      const onMessageWrappers = new DefaultWeakMap(listener => {
        if (typeof listener !== "function") {
          return listener;
        }
        /**
         * Wraps a message listener function so that it may send responses based on
         * its return value, rather than by returning a sentinel value and calling a
         * callback. If the listener function returns a Promise, the response is
         * sent when the promise either resolves or rejects.
         *
         * @param {*} message
         *        The message sent by the other end of the channel.
         * @param {object} sender
         *        Details about the sender of the message.
         * @param {function(*)} sendResponse
         *        A callback which, when called with an arbitrary argument, sends
         *        that value as a response.
         * @returns {boolean}
         *        True if the wrapped listener returned a Promise, which will later
         *        yield a response. False otherwise.
         */


        return function onMessage(message, sender, sendResponse) {
          let didCallSendResponse = false;
          let wrappedSendResponse;
          let sendResponsePromise = new Promise(resolve => {
            wrappedSendResponse = function (response) {
              didCallSendResponse = true;
              resolve(response);
            };
          });
          let result;

          try {
            result = listener(message, sender, wrappedSendResponse);
          } catch (err) {
            result = Promise.reject(err);
          }

          const isResultThenable = result !== true && isThenable(result); // If the listener didn't returned true or a Promise, or called
          // wrappedSendResponse synchronously, we can exit earlier
          // because there will be no response sent from this listener.

          if (result !== true && !isResultThenable && !didCallSendResponse) {
            return false;
          } // A small helper to send the message if the promise resolves
          // and an error if the promise rejects (a wrapped sendMessage has
          // to translate the message into a resolved promise or a rejected
          // promise).


          const sendPromisedResult = promise => {
            promise.then(msg => {
              // send the message value.
              sendResponse(msg);
            }, error => {
              // Send a JSON representation of the error if the rejected value
              // is an instance of error, or the object itself otherwise.
              let message;

              if (error && (error instanceof Error || typeof error.message === "string")) {
                message = error.message;
              } else {
                message = "An unexpected error occurred";
              }

              sendResponse({
                __mozWebExtensionPolyfillReject__: true,
                message
              });
            }).catch(err => {
              // Print an error on the console if unable to send the response.
              console.error("Failed to send onMessage rejected reply", err);
            });
          }; // If the listener returned a Promise, send the resolved value as a
          // result, otherwise wait the promise related to the wrappedSendResponse
          // callback to resolve and send it as a response.


          if (isResultThenable) {
            sendPromisedResult(result);
          } else {
            sendPromisedResult(sendResponsePromise);
          } // Let Chrome know that the listener is replying.


          return true;
        };
      });

      const wrappedSendMessageCallback = ({
        reject,
        resolve
      }, reply) => {
        if (extensionAPIs.runtime.lastError) {
          // Detect when none of the listeners replied to the sendMessage call and resolve
          // the promise to undefined as in Firefox.
          // See https://github.com/mozilla/webextension-polyfill/issues/130
          if (extensionAPIs.runtime.lastError.message === CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE) {
            resolve();
          } else {
            reject(new Error(extensionAPIs.runtime.lastError.message));
          }
        } else if (reply && reply.__mozWebExtensionPolyfillReject__) {
          // Convert back the JSON representation of the error into
          // an Error instance.
          reject(new Error(reply.message));
        } else {
          resolve(reply);
        }
      };

      const wrappedSendMessage = (name, metadata, apiNamespaceObj, ...args) => {
        if (args.length < metadata.minArgs) {
          throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
        }

        if (args.length > metadata.maxArgs) {
          throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
        }

        return new Promise((resolve, reject) => {
          const wrappedCb = wrappedSendMessageCallback.bind(null, {
            resolve,
            reject
          });
          args.push(wrappedCb);
          apiNamespaceObj.sendMessage(...args);
        });
      };

      const staticWrappers = {
        devtools: {
          network: {
            onRequestFinished: wrapEvent(onRequestFinishedWrappers)
          }
        },
        runtime: {
          onMessage: wrapEvent(onMessageWrappers),
          onMessageExternal: wrapEvent(onMessageWrappers),
          sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
            minArgs: 1,
            maxArgs: 3
          })
        },
        tabs: {
          sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
            minArgs: 2,
            maxArgs: 3
          })
        }
      };
      const settingMetadata = {
        clear: {
          minArgs: 1,
          maxArgs: 1
        },
        get: {
          minArgs: 1,
          maxArgs: 1
        },
        set: {
          minArgs: 1,
          maxArgs: 1
        }
      };
      apiMetadata.privacy = {
        network: {
          "*": settingMetadata
        },
        services: {
          "*": settingMetadata
        },
        websites: {
          "*": settingMetadata
        }
      };
      return wrapObject(extensionAPIs, staticWrappers, apiMetadata);
    }; // The build process adds a UMD wrapper around this file, which makes the
    // `module` variable available.


    module.exports = wrapAPIs(chrome);
  } else {
    module.exports = globalThis.browser;
  }
});


},{}],2:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _TabMap_tabs, _TabMap_storageKey, _TabMap_activeTab, _TabMap_lastActiveTab, _TabMap_element, _TabMap_retrieveTabs, _TabMap_updateCache, _TabMap_getCache, _TabMap_initUI, _TabMap_onUpdated, _Tab_element, _Tab_wrapperEl, _Tab_spacerEl, _Tab_titleEl, _Tab_childrenEl, _Tab_children, _Tab_childrenLast, _Tab_updateElement, _Tab_updateChildrenElement, _Tab_updateTitleElement, _Tab_updated;
Object.defineProperty(exports, "__esModule", { value: true });
const webextension_polyfill_1 = __importDefault(require("webextension-polyfill"));
let hasInit = false;
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
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
        webextension_polyfill_1.default.tabs.onActivated.addListener(TABS.activated);
        webextension_polyfill_1.default.tabs.onCreated.addListener(TABS.created);
        webextension_polyfill_1.default.tabs.onRemoved.addListener(TABS.removed);
        hasInit = true;
    }
}));
class TabMap {
    // TODO: WIP the cache needs to be loaded, compared with existing tabs, set parents of these tabs, THEN render the UI
    constructor() {
        _TabMap_tabs.set(this, new Map());
        _TabMap_storageKey.set(this, '');
        _TabMap_activeTab.set(this, void 0);
        _TabMap_lastActiveTab.set(this, void 0);
        _TabMap_element.set(this, document.querySelector('#sidebar'));
        // NOTE: PRIVATE Methods
        // WARN: might need to setup queues for tab updates, or adding, removing, etc.
        _TabMap_retrieveTabs.set(this, () => __awaiter(this, void 0, void 0, function* () {
            const winDat = yield webextension_polyfill_1.default.windows.getCurrent({ populate: true });
            const cache = yield __classPrivateFieldGet(this, _TabMap_getCache, "f").call(this);
            const tabs = winDat.tabs;
            let rtrn = [];
            if (__classPrivateFieldGet(this, _TabMap_tabs, "f").size > 0) {
                console.error("tabs already exist, not retrieving tabs.");
                return undefined;
            }
            // NOTE: for each cached tab
            cache === null || cache === void 0 ? void 0 : cache.forEach(tab => {
                const ft = tabs.find(t => t.url === tab.url);
                // NOTE: see if the tab exists in the browser
                if (ft) {
                    if (!tab.parentUrl) {
                        const tb = new Tab(ft.id, ft.title, ft.url, undefined);
                        if (ft.active) {
                            tb.changeActive(true);
                            this.activeTab = {
                                id: tb.id,
                                title: tb.title,
                            };
                        }
                        rtrn.push(tb);
                    }
                    else {
                        let parent = tabs.find(t => t.url === tab.parentUrl);
                        if (parent) {
                            const tb = new Tab(ft.id, ft.title, ft.url, parent.id);
                            if (ft.active) {
                                tb.changeActive(true);
                                this.activeTab = {
                                    id: tb.id,
                                    title: tb.title,
                                };
                            }
                            rtrn.push(tb);
                        }
                    }
                }
            });
            tabs.forEach(tab => {
                const ft = rtrn.find(t => t.url === tab.url);
                if (!ft) {
                    const tb = new Tab(tab.id, tab.title, tab.url, undefined);
                    if (tab.active) {
                        tb.changeActive(true);
                        this.activeTab = {
                            id: tb.id,
                            title: tb.title,
                        };
                    }
                    rtrn.push(tb);
                }
            });
            return rtrn;
        }));
        _TabMap_updateCache.set(this, () => {
            let tabEssences = [];
            for (const value of __classPrivateFieldGet(this, _TabMap_tabs, "f").values()) {
                tabEssences.push(value.distillEssence());
            }
            const cache = { [__classPrivateFieldGet(this, _TabMap_storageKey, "f")]: JSON.stringify(tabEssences) };
            console.log("set cache: ", cache);
            webextension_polyfill_1.default.storage.local.set(cache).catch(e => {
                console.error("cache error: ", e);
            });
        });
        _TabMap_getCache.set(this, () => __awaiter(this, void 0, void 0, function* () {
            const b = yield webextension_polyfill_1.default.storage.local.get(null);
            if (b[__classPrivateFieldGet(this, _TabMap_storageKey, "f")] === undefined) {
                return undefined;
            }
            const cache = JSON.parse(b[__classPrivateFieldGet(this, _TabMap_storageKey, "f")]);
            console.log("get cache: ", cache);
            return cache;
        }));
        _TabMap_initUI.set(this, () => {
            __classPrivateFieldGet(this, _TabMap_element, "f").innerHTML = '';
            __classPrivateFieldGet(this, _TabMap_tabs, "f").forEach((tab) => {
                if (tab.parentId !== undefined) {
                    const parent = __classPrivateFieldGet(this, _TabMap_tabs, "f").get(tab.parentId);
                    if (parent !== undefined) {
                        console.error("Parent not found: ", tab.id, parent.id);
                    }
                    parent.addChild(tab.id);
                }
                __classPrivateFieldGet(this, _TabMap_element, "f").appendChild(tab.element);
            });
        });
        _TabMap_onUpdated.set(this, (tabId, changeInfo, tab) => {
            if (__classPrivateFieldGet(this, _TabMap_tabs, "f").has(tabId)) {
                __classPrivateFieldGet(this, _TabMap_updateCache, "f").call(this);
            }
        }
        // NOTE: PUBLIC Methods
        );
        // NOTE: PUBLIC Methods
        this.add = (tab) => __awaiter(this, void 0, void 0, function* () {
            __classPrivateFieldGet(this, _TabMap_tabs, "f").set(tab.id, tab);
            const newtabbehavior = yield webextension_polyfill_1.default.storage.local.get('newtabbehavior');
            console.log("start", "activeTab: ", this.activeTab, "lastActiveTab: ", __classPrivateFieldGet(this, _TabMap_lastActiveTab, "f"));
            // FIXME: need to figure out why the tabs aren't getting added as children
            if (tab.parentId === undefined) {
                let activeTab;
                if (this.activeTab && this.activeTab.id === tab.id) {
                    if (__classPrivateFieldGet(this, _TabMap_lastActiveTab, "f")) {
                        activeTab = this.get(__classPrivateFieldGet(this, _TabMap_lastActiveTab, "f").id);
                    }
                    else {
                        console.log("early return 1");
                        return;
                    }
                }
                else {
                    if (this.activeTab) {
                        activeTab = this.get(this.activeTab.id);
                    }
                    else {
                        if (tab.isActive) {
                            activeTab = undefined;
                            this.activeTab = {
                                id: tab.id,
                                title: tab.title,
                            };
                        }
                        else {
                            console.log("early return 2");
                            return;
                        }
                    }
                }
                switch (newtabbehavior['newtabbehavior']) {
                    case "0":
                        tab.parentId = activeTab === null || activeTab === void 0 ? void 0 : activeTab.id;
                        break;
                    case "1":
                        tab.parentId = activeTab === null || activeTab === void 0 ? void 0 : activeTab.parentId;
                        break;
                }
            }
            if (tab.parentId !== undefined) {
                const parent = this.get(tab.parentId);
                parent.addChild(tab.id);
                console.log("added", tab.id, "to", parent.id);
            }
            else {
                __classPrivateFieldGet(this, _TabMap_element, "f").appendChild(tab.element);
                __classPrivateFieldGet(this, _TabMap_tabs, "f").set(tab.id, tab);
                console.log("added", tab.id, "to root");
            }
            console.log("end", "activeTab: ", this.activeTab, "lastActiveTab: ", __classPrivateFieldGet(this, _TabMap_lastActiveTab, "f"));
            __classPrivateFieldGet(this, _TabMap_updateCache, "f").call(this);
        });
        this.remove = (id) => {
            const tab = this.get(id);
            tab.remove();
            __classPrivateFieldGet(this, _TabMap_tabs, "f").delete(id);
            __classPrivateFieldGet(this, _TabMap_updateCache, "f").call(this);
        };
        this.get = (id) => {
            return __classPrivateFieldGet(this, _TabMap_tabs, "f").get(id);
        };
        this.has = (id) => {
            return __classPrivateFieldGet(this, _TabMap_tabs, "f").has(id);
        };
        // NOTE: listener callbacks
        this.created = (tab) => __awaiter(this, void 0, void 0, function* () {
            const tb = new Tab(tab.id, tab.title, tab.url);
            if (tab.active) {
                console.log("active tab created", tab);
                tb.changeActive(true);
                yield this.add(tb);
                this.activeTab = {
                    id: tab.id,
                    title: tab.title,
                };
            }
            else {
                console.log("normal tab created", tab);
                this.add(tb);
            }
        });
        this.removed = (tabId, removeInfo) => {
            const tab = this.get(tabId);
            if (tab !== undefined) {
                this.remove(tabId);
                tab.remove();
            }
        };
        this.activated = (activeInfo) => {
            if (activeInfo.tabId) {
                const tab = this.get(activeInfo.tabId);
                if (tab) {
                    this.activeTab = {
                        id: tab.id,
                        title: tab.title,
                    };
                }
            }
        };
        webextension_polyfill_1.default.windows.getCurrent().then(w => {
            this.winId = w.id;
            __classPrivateFieldSet(this, _TabMap_storageKey, "tabs-" + w.id, "f");
            webextension_polyfill_1.default.tabs.onUpdated.addListener(__classPrivateFieldGet(this, _TabMap_onUpdated, "f"), { windowId: this.winId });
        });
        __classPrivateFieldGet(this, _TabMap_retrieveTabs, "f").call(this).then(e => {
            if (e) {
                e.forEach(t => {
                    TABS.add(t);
                });
                __classPrivateFieldGet(this, _TabMap_initUI, "f").call(this);
            }
        });
    }
    // NOTE: Getters and Setters
    get length() {
        return __classPrivateFieldGet(this, _TabMap_tabs, "f").size;
    }
    get activeTab() {
        return __classPrivateFieldGet(this, _TabMap_activeTab, "f");
    }
    set activeTab(val) {
        if (val) {
            const tab = this.get(val.id);
            if (tab) {
                __classPrivateFieldSet(this, _TabMap_lastActiveTab, __classPrivateFieldGet(this, _TabMap_activeTab, "f"), "f");
                __classPrivateFieldSet(this, _TabMap_activeTab, {
                    id: tab.id,
                    title: tab.title,
                }, "f");
                __classPrivateFieldGet(this, _TabMap_tabs, "f").forEach((tb) => {
                    if (tb.id == tab.id) {
                        tb.changeActive(true);
                    }
                    else {
                        tb.changeActive(false);
                    }
                });
            }
            else {
                console.error("Setting activeTab not possible: Tab not found ", val);
            }
        }
    }
}
_TabMap_tabs = new WeakMap(), _TabMap_storageKey = new WeakMap(), _TabMap_activeTab = new WeakMap(), _TabMap_lastActiveTab = new WeakMap(), _TabMap_element = new WeakMap(), _TabMap_retrieveTabs = new WeakMap(), _TabMap_updateCache = new WeakMap(), _TabMap_getCache = new WeakMap(), _TabMap_initUI = new WeakMap(), _TabMap_onUpdated = new WeakMap();
class Tab {
    constructor(id, title, url, parentId) {
        _Tab_element.set(this, document.createElement('div'));
        _Tab_wrapperEl.set(this, document.createElement('div'));
        _Tab_spacerEl.set(this, document.createElement('div'));
        _Tab_titleEl.set(this, document.createElement('div'));
        _Tab_childrenEl.set(this, document.createElement('div'));
        _Tab_children.set(this, []);
        _Tab_childrenLast.set(this, []);
        this.isActive = false;
        // NOTE: PRIVATE Methods
        _Tab_updateElement.set(this, () => {
            var _a;
            __classPrivateFieldGet(this, _Tab_element, "f").innerHTML = "";
            __classPrivateFieldGet(this, _Tab_element, "f").id = "p" + this.id.toString();
            __classPrivateFieldGet(this, _Tab_element, "f").classList.add('tab');
            __classPrivateFieldGet(this, _Tab_element, "f").onclick = () => {
                console.log(this.id, (__classPrivateFieldGet(this, _Tab_children, "f").length > 0) ? ("has children: " + __classPrivateFieldGet(this, _Tab_children, "f")) : "does not have children");
                // browser.tabs.update(this.id, { active: true });
            };
            __classPrivateFieldGet(this, _Tab_wrapperEl, "f").classList.add('labelwrapper');
            const spcrcontents = (_a = document.querySelector('#arrow')) === null || _a === void 0 ? void 0 : _a.innerHTML;
            __classPrivateFieldGet(this, _Tab_spacerEl, "f").classList.add('spacer');
            __classPrivateFieldGet(this, _Tab_spacerEl, "f").innerHTML = spcrcontents;
            if (this.parentId) {
                __classPrivateFieldGet(this, _Tab_wrapperEl, "f").appendChild(__classPrivateFieldGet(this, _Tab_spacerEl, "f"));
            }
            __classPrivateFieldGet(this, _Tab_wrapperEl, "f").appendChild(__classPrivateFieldGet(this, _Tab_titleEl, "f"));
            __classPrivateFieldGet(this, _Tab_element, "f").appendChild(__classPrivateFieldGet(this, _Tab_wrapperEl, "f"));
            __classPrivateFieldGet(this, _Tab_element, "f").appendChild(__classPrivateFieldGet(this, _Tab_childrenEl, "f"));
        });
        _Tab_updateChildrenElement.set(this, () => {
            __classPrivateFieldGet(this, _Tab_childrenEl, "f").classList.add('children');
            if (__classPrivateFieldGet(this, _Tab_children, "f") !== __classPrivateFieldGet(this, _Tab_childrenLast, "f")) {
            }
            __classPrivateFieldGet(this, _Tab_children, "f").forEach((e) => {
                const tab = TABS.get(e);
                if (tab) {
                    __classPrivateFieldGet(this, _Tab_childrenEl, "f").appendChild(tab.element);
                }
            });
            __classPrivateFieldSet(this, _Tab_childrenLast, __classPrivateFieldGet(this, _Tab_children, "f"), "f");
        });
        _Tab_updateTitleElement.set(this, () => {
            __classPrivateFieldGet(this, _Tab_titleEl, "f").classList.add('label');
            __classPrivateFieldGet(this, _Tab_titleEl, "f").textContent = this.title;
        }
        // NOTE: PUBLIC Methods
        );
        this.remove = () => {
            __classPrivateFieldGet(this, _Tab_element, "f").remove();
            if (this.parentId) {
                TABS.get(this.parentId).removeChild(this.id);
            }
            __classPrivateFieldGet(this, _Tab_updateElement, "f").call(this);
        };
        this.addChild = (tabId) => {
            if (__classPrivateFieldGet(this, _Tab_children, "f").includes(tabId)) {
                return;
            }
            __classPrivateFieldGet(this, _Tab_children, "f").push(tabId);
            __classPrivateFieldGet(this, _Tab_updateChildrenElement, "f").call(this);
            console.log("Added child: ", tabId, "to", this.id);
        };
        this.removeChild = (tabId) => {
            if (!__classPrivateFieldGet(this, _Tab_children, "f").includes(tabId)) {
                return;
            }
            __classPrivateFieldSet(this, _Tab_children, __classPrivateFieldGet(this, _Tab_children, "f").filter((e) => e !== tabId), "f");
            __classPrivateFieldGet(this, _Tab_updateChildrenElement, "f").call(this);
            console.log("Removed child: ", tabId, "from", this.id);
        };
        this.getChild = (id) => {
            return __classPrivateFieldGet(this, _Tab_children, "f").find((e) => e === id);
        };
        this.changeActive = (b) => {
            if (b) {
                this.isActive = true;
                __classPrivateFieldGet(this, _Tab_element, "f").classList.add('active');
            }
            else {
                this.isActive = false;
                __classPrivateFieldGet(this, _Tab_element, "f").classList.remove('active');
            }
        };
        this.distillEssence = () => {
            return {
                id: this.id,
                title: this.title,
                url: this.url,
                parentUrl: this.parentId ? TABS.get(this.parentId).url : undefined,
            };
        };
        // NOTE: Listeners
        _Tab_updated.set(this, (tabId, changeInfo, tab) => {
            if (changeInfo.title) {
                console.log("tab updated", tabId, changeInfo.title);
                this.title = tab.title;
                __classPrivateFieldGet(this, _Tab_updateTitleElement, "f").call(this);
            }
            if (changeInfo.url) {
                console.log("tab updated", tabId, changeInfo.url);
                this.url = tab.url;
            }
        });
        this.id = id;
        this.title = title;
        this.parentId = parentId || undefined;
        this.url = url;
        webextension_polyfill_1.default.tabs.onUpdated.addListener(__classPrivateFieldGet(this, _Tab_updated, "f"), { tabId: this.id, windowId: webextension_polyfill_1.default.windows.WINDOW_ID_CURRENT, properties: ["title", "url"] });
        __classPrivateFieldGet(this, _Tab_updateElement, "f").call(this);
        __classPrivateFieldGet(this, _Tab_updateTitleElement, "f").call(this);
        __classPrivateFieldGet(this, _Tab_updateChildrenElement, "f").call(this);
    }
    // NOTE: PUBLIC Methods
    get element() {
        return __classPrivateFieldGet(this, _Tab_element, "f");
    }
}
_Tab_element = new WeakMap(), _Tab_wrapperEl = new WeakMap(), _Tab_spacerEl = new WeakMap(), _Tab_titleEl = new WeakMap(), _Tab_childrenEl = new WeakMap(), _Tab_children = new WeakMap(), _Tab_childrenLast = new WeakMap(), _Tab_updateElement = new WeakMap(), _Tab_updateChildrenElement = new WeakMap(), _Tab_updateTitleElement = new WeakMap(), _Tab_updated = new WeakMap();
const TABS = new TabMap();

},{"webextension-polyfill":1}]},{},[2]);
