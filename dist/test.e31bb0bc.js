// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"../node_modules/regenerator-runtime/runtime.js":[function(require,module,exports) {
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] =
    GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return Promise.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[toStringTagSymbol] = "Generator";

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
  typeof module === "object" ? module.exports : {}
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  Function("r", "regeneratorRuntime = r")(runtime);
}

},{}],"../node_modules/@babel/runtime/regenerator/index.js":[function(require,module,exports) {
module.exports = require("regenerator-runtime");

},{"regenerator-runtime":"../node_modules/regenerator-runtime/runtime.js"}],"../node_modules/@babel/runtime/helpers/asyncToGenerator.js":[function(require,module,exports) {
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

module.exports = _asyncToGenerator;
},{}],"../node_modules/tezbridge-network/types.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.safeProp = safeProp;

function safeProp(x, ...props) {
  let result = undefined;
  let prop;
  let curr = x;

  while (true) {
    prop = props.shift();
    if (prop === undefined) break;

    if (curr instanceof Object && !(curr instanceof Array)) {
      result = curr[prop];
      curr = curr[prop];
    } else if (curr instanceof Array) {
      const prop_index = parseInt(prop);
      if (isNaN(prop_index)) return undefined;
      result = curr[prop_index];
      curr = curr[prop_index];
    } else {
      return undefined;
    }
  }

  return result;
}
},{}],"../node_modules/tezbridge-network/util.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkProps = checkProps;
exports.filterHashUrl = filterHashUrl;
exports.OpStep = void 0;

function checkProps(obj, ...props) {
  let prop = props.shift();
  let cursor = obj;

  while (prop !== undefined) {
    if (!(prop in cursor) || cursor[prop] === undefined) throw `Property: ${prop} is not in the object`;
    prop = props.shift();
    cursor = cursor[prop];
  }
}

function filterHashUrl(x) {
  if (x.indexOf('/') === -1) throw "The input hash_url should be in this format: `xx/xx/xx/xx/xx/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`";
  const start = x[0] === '/' ? 1 : 0;
  const end = x.slice(-1) === '/' ? -1 : x.length;
  return x.slice(start, end);
}

class OpStep {
  constructor(main_fn, ...next_nodes) {
    this.main_fn = main_fn;
    this.next_nodes = next_nodes;
  }

  run(...args) {
    const result = this.main_fn.apply(this, args);

    if (typeof result === 'boolean') {
      if (result) return this.next_nodes[0] && this.next_nodes[0].run();else return this.next_nodes[1] && this.next_nodes[1].run();
    }

    if (result instanceof Promise) {
      return result.then(x => this.next_nodes[0] && this.next_nodes[0].run(x)).catch(err => {
        throw `OpStep error caught: ${err}`;
      });
    }
  }

}

exports.OpStep = OpStep;
},{}],"../node_modules/tezbridge-network/PsBABY5H/api.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Mixed = exports.op_processes = exports.default_op_params = exports.Posts = exports.Gets = exports.default_config = void 0;

var _types = require("../types");

var _util = require("../util");

const default_config = {
  gas_limit: '800000',
  storage_limit: '60000',
  fake_sig: 'edsigu6FNEzqHPAbQAUjjKtcAFkiW4The5BQbCj53bCyV9st32aHrcZhqnzLWw74HiwMScMh1SiTgY8juYUAUsJ3JG2DvGeCFjd'
};
exports.default_config = default_config;

class Gets {
  constructor(fetch) {
    this.fetch = fetch;
  }

  custom(path) {
    return this.fetch(path);
  }

  head(sub_path) {
    return this.fetch(`/chains/main/blocks/head/${sub_path || ''}`);
  }

  hash() {
    return this.head('hash');
  }

  header() {
    return this.head('header');
  }

  protocol() {
    return this.header().then(x => (0, _types.safeProp)(x, 'protocol'));
  }

  predecessor() {
    return this.header().then(x => (0, _types.safeProp)(x, 'predecessor'));
  }

  balance(address) {
    return this.fetch(`/chains/main/blocks/head/context/contracts/${address}/balance`);
  }

  contract(address) {
    return this.fetch(`/chains/main/blocks/head/context/contracts/${address}`);
  }

  contract_bytes(hash_url, sub_path) {
    const hash = (0, _util.filterHashUrl)(hash_url);
    return this.fetch(`/chains/main/blocks/head/context/raw/bytes/contracts/index/originated/${hash}${sub_path || ''}`);
  }

  storage_bytes(hash_url) {
    return this.contract_bytes(hash_url, '/data/storage');
  }

  big_map_bytes(hash_url) {
    return this.contract_bytes(hash_url, '/big_map');
  }

  manager_key(address) {
    return this.fetch(`/chains/main/blocks/head/context/contracts/${address}/manager_key`);
  }

  counter(address) {
    return this.fetch(`/chains/main/blocks/head/context/contracts/${address}/counter`);
  }

}

exports.Gets = Gets;

class Posts {
  constructor(submit) {
    this.submit = submit;
  }

  pack_data(data_json, type_json) {
    const param = {
      "data": data_json,
      "type": type_json,
      "gas": default_config.gas_limit
    };
    return this.submit(`/chains/main/blocks/head/helpers/scripts/pack_data`, param).then(x => (0, _types.safeProp)(x, 'packed')).catch(err => Promise.reject(err instanceof ProgressEvent ? 'Pack data failed' : err));
  }

  forge_operation(head_hash, ops) {
    const param = {
      branch: head_hash,
      contents: ops
    };
    return this.submit(`/chains/main/blocks/head/helpers/forge/operations`, param).catch(err => Promise.reject(err instanceof ProgressEvent ? 'forge operation failed' : err));
  }

  run_operation(head_hash, chain_id, ops) {
    const param = {
      operation: {
        branch: head_hash,
        contents: ops,
        signature: default_config.fake_sig
      },
      chain_id
    };
    return this.submit(`/chains/main/blocks/head/helpers/scripts/run_operation`, param).catch(err => Promise.reject(err instanceof ProgressEvent ? 'run operation failed' : err));
  }

  preapply_operation(head_hash, ops, protocol, signature) {
    const param = {
      branch: head_hash,
      contents: ops,
      protocol,
      signature
    };
    return this.submit(`/chains/main/blocks/head/helpers/preapply/operations`, [param]).catch(err => Promise.reject(err instanceof ProgressEvent ? 'preapply operation failed' : err));
  }

  inject_operation(signed_op) {
    return this.submit('/injection/operation', signed_op).catch(err => Promise.reject(err instanceof ProgressEvent ? 'inject operation failed' : err));
  }

}

exports.Posts = Posts;
const default_op_params = {
  reveal(source, public_key, counter) {
    return {
      kind: 'reveal',
      source,
      fee: '1300',
      gas_limit: '10000',
      storage_limit: '0',
      public_key,
      counter
    };
  },

  transaction(source, destination, counter) {
    return {
      kind: 'transaction',
      source,
      fee: default_config.gas_limit,
      gas_limit: default_config.gas_limit,
      storage_limit: default_config.storage_limit,
      amount: '0',
      counter,
      destination // parameters?: $micheline.michelson_v1.expression

    };
  },

  origination(source, counter) {
    return {
      kind: 'origination',
      source,
      fee: default_config.gas_limit,
      counter,
      gas_limit: default_config.gas_limit,
      storage_limit: default_config.storage_limit,
      // manager_pubkey: manager_key,
      balance: '0' // spendable: true,
      // delegatable: true
      // "delegate"?: $Signature.Public_key_hash,
      // "script"?: $scripted.contracts

    };
  },

  delegation(source, delegate, counter) {
    return {
      counter,
      delegate,
      fee: "1420",
      gas_limit: "10000",
      kind: "delegation",
      source,
      storage_limit: "0"
    };
  }

};
exports.default_op_params = default_op_params;
const op_processes = {
  preProcess(op) {
    if (op.source.indexOf('KT1') === 0) throw `PsBABY5H does not support KT1 address to be the source`;

    if (op.kind === 'origination') {
      if (!op.script) {
        op.script = {
          code: [{
            "prim": "parameter",
            "args": [{
              "prim": "or",
              "args": [{
                "prim": "lambda",
                "args": [{
                  "prim": "unit"
                }, {
                  "prim": "list",
                  "args": [{
                    "prim": "operation"
                  }]
                }],
                "annots": ["%do"]
              }, {
                "prim": "unit",
                "annots": ["%default"]
              }]
            }]
          }, {
            "prim": "storage",
            "args": [{
              "prim": "key_hash"
            }]
          }, {
            "prim": "code",
            "args": [[[[{
              "prim": "DUP"
            }, {
              "prim": "CAR"
            }, {
              "prim": "DIP",
              "args": [[{
                "prim": "CDR"
              }]]
            }]], {
              "prim": "IF_LEFT",
              "args": [[{
                "prim": "PUSH",
                "args": [{
                  "prim": "mutez"
                }, {
                  "int": "0"
                }]
              }, {
                "prim": "AMOUNT"
              }, [[{
                "prim": "COMPARE"
              }, {
                "prim": "EQ"
              }], {
                "prim": "IF",
                "args": [[], [[{
                  "prim": "UNIT"
                }, {
                  "prim": "FAILWITH"
                }]]]
              }], [{
                "prim": "DIP",
                "args": [[{
                  "prim": "DUP"
                }]]
              }, {
                "prim": "SWAP"
              }], {
                "prim": "IMPLICIT_ACCOUNT"
              }, {
                "prim": "ADDRESS"
              }, {
                "prim": "SENDER"
              }, [[{
                "prim": "COMPARE"
              }, {
                "prim": "EQ"
              }], {
                "prim": "IF",
                "args": [[], [[{
                  "prim": "UNIT"
                }, {
                  "prim": "FAILWITH"
                }]]]
              }], {
                "prim": "UNIT"
              }, {
                "prim": "EXEC"
              }, {
                "prim": "PAIR"
              }], [{
                "prim": "DROP"
              }, {
                "prim": "NIL",
                "args": [{
                  "prim": "operation"
                }]
              }, {
                "prim": "PAIR"
              }]]
            }]]
          }],
          storage: {
            string: op.source
          }
        };
      }
    } else if (op.kind === 'transaction') {
      if (!op.parameters) {
        op.parameters = {
          entrypoint: 'default',
          value: {
            prim: 'Unit'
          }
        };
      } else if (!op.parameters.entrypoint) {
        const params = op.parameters;
        op.parameters = {
          entrypoint: 'default',
          value: params
        };
      }
    }
  }

};
exports.op_processes = op_processes;

class Mixed {
  constructor(fetch, submit) {
    this.fetch = fetch;
    this.submit = submit;
  }

  async makeOperationBytes(param, op_params, no_forge = false, prev_fetched = {}) {
    const ops = [];
    const counter_prev = prev_fetched.counter || (await this.fetch.counter(param.source));
    const manager_key = prev_fetched.manager_key || (await this.fetch.manager_key(param.source));
    if (typeof counter_prev !== 'string') throw 'Invalid counter';
    let counter = parseInt(counter_prev) + 1 + '';

    if (!manager_key) {
      const reveal = default_op_params.reveal(param.source, param.public_key, counter);
      if (op_params.length && op_params[0].kind === 'reveal') ops.push(Object.assign({}, reveal, op_params.shift()));else ops.push(reveal);
      counter = parseInt(counter) + 1 + '';
    }

    op_params.forEach(item => {
      const op = {
        reveal: null,
        origination: Object.assign({}, default_op_params.origination(param.source, counter), item),
        transaction: Object.assign({}, default_op_params.transaction(param.source, item.destination || '', counter), item),
        delegation: Object.assign({}, default_op_params.delegation(param.source, item.delegate || '', counter))
      }[item.kind];
      if (!op) throw `Invalid t(${item.kind}) in makeOperationBytes`;
      op_processes.preProcess(op);
      ops.push(op);
      counter = parseInt(counter) + 1 + '';
    });
    const header = prev_fetched.header || (await this.fetch.header());
    if (!(typeof header.hash === 'string')) throw `Error type for head_hash result: ${header.hash.toString()}`;
    const operation_hex = no_forge ? '' : await this.submit.forge_operation(header.hash, ops);
    return {
      protocol: header.protocol,
      operation_hex,
      branch: header.hash,
      contents: ops
    };
  }

  async makeOriginationBytes(basic, op_param) {
    return this.makeOperationBytes({
      source: basic.source,
      public_key: basic.public_key
    }, [Object.assign({
      kind: 'origination'
    }, op_param)]);
  }

  async makeTransactionBytes(basic, op_param) {
    return this.makeOperationBytes({
      source: basic.source,
      public_key: basic.public_key
    }, [Object.assign({
      kind: 'transaction'
    }, op_param)]);
  }

  async makeMinFeeOperationBase(TBC, source, pub_key, sign_fn, op_params, no_remote_forge = false, outside = {
    step: 0
  }) {
    outside.step = 1;
    const counter = await this.fetch.counter(source);
    const manager_key = await this.fetch.manager_key(source);
    const header = await this.fetch.header();
    const prefetched = {
      counter,
      manager_key,
      header // operation bytes generated with max fee

    };
    op_params.forEach(op => {
      delete op.fee;
      delete op.gas_limit;
      delete op.storage_limit;
    });
    const op_bytes_result = await this.makeOperationBytes({
      source: source,
      public_key: pub_key
    }, op_params, no_remote_forge, prefetched);
    const ops = op_bytes_result.contents;
    outside.step = 2; // remote / local bytes comparison

    const local_hex = TBC.localop.forgeOperation(op_bytes_result.contents, header.hash);
    if (!op_bytes_result.operation_hex) op_bytes_result.operation_hex = local_hex;

    if (local_hex !== op_bytes_result.operation_hex) {
      throw `Inconsistent forged bytes:\nLocal(${local_hex})\nRemote(${op_bytes_result.operation_hex})`;
    } // run the max fee operation to get the cost fee
    // also it will assign the cost fee to the items of `ops` 


    outside.step = 3;
    const run_operation_result = await this.submit.run_operation(header.hash, header.chain_id, op_bytes_result.contents);
    let gas_sum = 0;
    run_operation_result.contents.forEach((content, index) => {
      let gas_limit = 0;
      let storage_limit = 0;
      const result = content.metadata.operation_result;
      const internal_operation_results = content.metadata.internal_operation_results;

      if (internal_operation_results) {
        internal_operation_results.forEach(op => {
          if (op.result.errors) throw `Internal operation errors:${JSON.stringify(op.result.errors, null, 2)}`;
          gas_limit += parseInt(op.result.consumed_gas);
          if (op.result.paid_storage_size_diff) storage_limit += parseInt(op.result.paid_storage_size_diff);
          if (op.result.originated_contracts) storage_limit += op.result.originated_contracts.length * 257;
          if (op.result.allocated_destination_contract) storage_limit += 257;
        });
      }

      if (result.errors) throw `Operation errors:${JSON.stringify(result.errors, null, 2)}`;
      gas_limit += parseInt(result.consumed_gas);
      if (result.paid_storage_size_diff) storage_limit += parseInt(result.paid_storage_size_diff);
      if (result.originated_contracts) storage_limit += result.originated_contracts.length * 257;
      if (result.allocated_destination_contract) storage_limit += 257;
      ops[index].gas_limit = gas_limit + '';
      ops[index].storage_limit = storage_limit + '';
      ops[index].fee = '0';
      gas_sum += parseInt(gas_limit);
    });
    const op_with_sig = op_bytes_result.operation_hex + TBC.codec.toHex(TBC.codec.bs58checkDecode(default_config.fake_sig));
    const fee = Math.ceil(100 + op_with_sig.length / 2 + 0.1 * gas_sum);
    let fee_left = fee;
    ops.forEach(op => {
      const consumption = fee_left <= +default_config.gas_limit ? fee_left : +default_config.gas_limit;
      op.fee = consumption + '';
      fee_left -= consumption;
    });
    if (fee_left) throw `Still need ${fee_left} fee to run the operation`;
    outside.step = 4; // operation bytes generated with exact fee

    const final_op_result = await this.makeOperationBytes({
      source: source,
      public_key: pub_key
    }, ops, no_remote_forge, prefetched);
    outside.step = 5; // remote / local bytes comparison

    const final_local_hex = TBC.localop.forgeOperation(final_op_result.contents, header.hash);
    if (!final_op_result.operation_hex) final_op_result.operation_hex = final_local_hex;

    if (final_local_hex !== final_op_result.operation_hex) {
      throw `Inconsistent final forged bytes:\nLocal(${local_hex})\nRemote(${final_op_result.operation_hex})`;
    }

    outside.step = 6;
    final_op_result.signature = await sign_fn(final_op_result.operation_hex);
    outside.step = 7; // preapply the exact fee operation to get the originated contracts

    const final_op_with_sig = final_op_result.operation_hex + TBC.codec.toHex(TBC.codec.bs58checkDecode(final_op_result.signature));
    const final_preapplied = await this.submit.preapply_operation(header.hash, final_op_result.contents, header.protocol, final_op_result.signature);
    if (!(final_preapplied instanceof Array)) throw `Invalid final preapplyed result: ${final_preapplied}`;
    const originated_contracts = [];
    final_preapplied[0].contents.forEach((content, index) => {
      const result = content.metadata.operation_result;
      const internal_operation_results = content.metadata.internal_operation_results;

      if (internal_operation_results) {
        internal_operation_results.forEach(op => {
          if (op.result.errors) throw `Final internal operation errors:${JSON.stringify(op.result.errors, null, 2)}`;
          if (op.result.originated_contracts) originated_contracts.push(op.result.originated_contracts);
        });
      }

      if (result.errors) throw `Final operation errors:${JSON.stringify(result.errors, null, 2)}`;
      if (result.originated_contracts) originated_contracts.push(result.originated_contracts);
    });
    outside.step = 8;
    return {
      fee,
      originated_contracts,
      branch: header.hash,
      operation_contents: final_op_result.contents,
      operation_with_sig: final_op_with_sig
    };
  }

  async makeMinFeeOperation(TBC, source, secret_key, op_params, no_remote_forge = false, outside = {
    step: 0
  }) {
    const key = TBC.crypto.getKeyFromSecretKey(secret_key);
    return await this.makeMinFeeOperationBase(TBC, source || key.address, key.getPublicKey(), async op_bytes => TBC.crypto.signOperation(op_bytes, secret_key), op_params, no_remote_forge, outside);
  }

}

exports.Mixed = Mixed;
var _default = {
  Gets,
  Posts,
  Mixed
};
exports.default = _default;
},{"../types":"../node_modules/tezbridge-network/types.js","../util":"../node_modules/tezbridge-network/util.js"}],"../node_modules/tezbridge-network/PsBABY5H/external.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.External = void 0;

class External {
  constructor(fetch, net_type) {
    this.fetch = fetch;
    this.net_type = net_type === 'alphanet' ? net_type : 'mainnet';
  }

  domain(net_type) {
    if (net_type === 'mainnet') return 'https://api1.tzscan.io/v3';else if (net_type === 'alphanet') return 'https://api.alphanet.tzscan.io/v3';else if (net_type === 'zeronet') return 'https://api.zeronet.tzscan.io/v3';else throw 'The net type can only be mainnet or alphanet';
  }

  async originated_contracts(address, spendable = true, net_type) {
    const url = this.domain(net_type || this.net_type) + `/operations/${address}?type=Origination`;
    const operations = await this.fetch(url);
    const result = [];
    if (operations instanceof Array) operations.forEach(op => {
      op.type.operations.forEach(inner_op => {
        result.push(inner_op.tz1.tz);
      });
    });else throw 'Operations is invalid';
    return result;
  }

}

exports.External = External;
},{}],"../node_modules/tezbridge-network/PsBABY5H/index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.TezBridgeNetwork = void 0;

var _api = _interopRequireDefault(require("./api"));

var _external = require("./external");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const RPCFn = (() => {
  if ("true") {
    return (url, data, method) => {
      return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        req.addEventListener('load', pe => {
          if (req.status === 200) resolve(JSON.parse(req.responseText));else reject(req.responseText);
        });
        req.addEventListener('error', reject);
        req.addEventListener('abort', reject);
        req.open(method, url);

        if (method === 'POST') {
          req.setRequestHeader('Content-Type', 'application/json');
          req.send(JSON.stringify(data));
        } else {
          req.send();
        }
      });
    };
  } else {
    const https = require('https');

    const url = require('url');

    return (raw_url, data, method) => {
      return new Promise((resolve, reject) => {
        const parsed_url = url.parse(raw_url);
        const options = {
          hostname: parsed_url.hostname,
          port: parsed_url.port,
          path: parsed_url.path,
          method,
          headers: raw_url.indexOf('tzscan.io/v3') > -1 ? {} : {
            'Content-Type': 'application/json'
          }
        };
        const req = https.request(options, res => {
          let data = '';
          res.on('data', d => {
            data += d.toString();
          });
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (err) {
              console.log('\x1b[31m%s\x1b[0m', 'RPC result JSON.parse error: ', data);
            }
          });
        });
        req.on('error', e => {
          reject(e);
        });

        if (method === 'POST') {
          req.write(JSON.stringify(data));
        }

        req.end();
      });
    };
  }
})();

class TezBridgeNetwork {
  constructor(params) {
    if (!params.host) throw "Please set the host parameter";
    this.host = params.host;
    this.RPCFn = RPCFn;
    this.net_type = this.host.indexOf('alphanet') > -1 ? 'alphanet' : 'mainnet';
    this.fetch = new _api.default.Gets((url, data) => this.get.call(this, url, data));
    this.submit = new _api.default.Posts((url, data) => this.post.call(this, url, data));
    this.mixed = new _api.default.Mixed(this.fetch, this.submit);
    this.external = new _external.External((url, data) => this.RPCFn(url, data, 'GET'), this.net_type);
  }

  get(url, data) {
    return this.RPCFn(this.host + url, data, 'GET');
  }

  post(url, data) {
    return this.RPCFn(this.host + url, data, 'POST');
  }

}

exports.TezBridgeNetwork = TezBridgeNetwork;
var _default = TezBridgeNetwork;
exports.default = _default;
},{"./api":"../node_modules/tezbridge-network/PsBABY5H/api.js","./external":"../node_modules/tezbridge-network/PsBABY5H/external.js"}],"index.js":[function(require,module,exports) {
"use strict";

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _PsBABY5H = _interopRequireDefault(require("tezbridge-network/PsBABY5H"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var client = new _PsBABY5H.default({
  host: 'https://alphanet-node.tzscan.io'
});

function main() {
  return _main.apply(this, arguments);
}

function _main() {
  _main = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee() {
    var contract_info, code;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return client.fetch.contract('KT18brAGvbtX8UGsKTAVex5k63YbZTYNzhpv');

          case 2:
            contract_info = _context.sent;
            code = contract_info.script.code;
            console.log(code);

          case 5:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _main.apply(this, arguments);
}

main();
},{"@babel/runtime/regenerator":"../node_modules/@babel/runtime/regenerator/index.js","@babel/runtime/helpers/asyncToGenerator":"../node_modules/@babel/runtime/helpers/asyncToGenerator.js","tezbridge-network/PsBABY5H":"../node_modules/tezbridge-network/PsBABY5H/index.js"}],"../../../../../usr/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "35533" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else {
        window.location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../../../../../usr/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js","index.js"], null)
//# sourceMappingURL=/test.e31bb0bc.js.map