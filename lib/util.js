// Copyright (c) 2013 Yahoo! Inc. All rights reserved. Copyrights licensed under the MIT License.
// See the accompanying LICENSE file for terms.

(function (win) {
/**
 * A lightweight utility library when a full Javascript framework isn't necessary.
 */
SimpleUtil = function ()
{
    var clone = 'cloneNode',
        len = 'length',
        proto = 'prototype',
        owns = 'hasOwnProperty',
        val = 'value',
        regexTrim = /^\s+|\s+$/g,
        doc,
        docEl,
        docStyle,
        docBody,
        click = 'click',
        checked = 'checked',
        cln = 'className',
        innerHtml = 'innerHTML',
        clRegex = function(cl)
        {
            return new RegExp('(^|\\s+)' + cl + '(\\s+|$)');
        },
        vendorPrefix = null,
        vendorPrefixCss = null,
        vendors = ['Webkit','Moz','O','ms'],
        // FF: transitionend, Opera: oTransitionEnd: (otransitionend v12), WebKit: webkitTransitionEnd, IE: MSTransitionEnd
        vendorExceptions = {
            //'Moz': {},
            'Webkit': {
                'transitionend': 'webkitTransitionEnd',
                'cancelAnimationFrame': 'webkitCancelRequestAnimationFrame',
                'optimizeSpeed': 'webkitOptimizeContrast'
            }
        };

    function setDoc(d) {
        doc = d || {};
        docEl = doc.documentElement || {};
        docStyle = docEl.style || {};
        docBody = doc.body || {};
        return d;
    }

    function isA(obj, type) {
        return typeof obj == type;
    }

    function isUnd(obj) {
        return isA(obj, 'undefined');
    }

    function isNull(obj) {
        return obj === null;
    }

    function isObj(obj) {
        return isA(obj, 'object') && obj !== null;
    }

    function isStr(obj) {
        return isA(obj, 'string');
    }

    function isFunc(obj) {
        return isA(obj, 'function');
    }

    function isNum(obj) {
        return isA(obj, 'number');
    }

    function isBool(obj) {
        return isA(obj, 'boolean');
    }

    function isArray(ar) {
        return Object[proto].toString.call(ar) === '[object Array]';
    }

    function isDom(obj) {
        var type = isObj(obj) && obj.nodeType;
        return type === 1 || type === 11;
    }

    function append(el, child) {
        if (isDom(el) && isDom(child)) {
            el.appendChild(child);
        }
    }

    function resolvePath(path) {
        return isArray(path) && path || (isStr(path) ? path.split('.') : []);
    }

    function toArray(collection)
    {
        var els = [],
            c, cl;

        for (c = 0, cl = collection[len]; c<cl; c++) {
            els.push(collection.item(c));
        }

        return els;
    }

    return {
        /**
         * Set the document used by SimpleUtil. Useful for Node.js.
         * @method
         * @param  {HTMLDocument} doc Document to set.
         * @return {HTMLDocument} The document passed in.
         */
        setDoc: setDoc,

        /**
         * Test for undefined.
         * @method
         * @param  {mixed}  obj Object to test.
         * @return {Boolean}
         */
        isUnd: isUnd,
 
        /**
         * Test for null.
         * @method
         * @param  {mixed}  obj Object to test.
         * @return {Boolean}
         */
        isNull: isNull,

        /**
         * Test for an object.
         * @method
         * @param  {mixed}  obj Object to test.
         * @return {Boolean}
         */
        isObj: isObj,

        /**
         * Test for a string.
         * @method
         * @param  {mixed}  obj Object to test.
         * @return {Boolean}
         */
        isStr: isStr,

        /**
         * Test for a function.
         * @method
         * @param  {mixed}  obj Object to test.
         * @return {Boolean}
         */
        isFunc: isFunc,

        /**
         * Test for a number.
         * @method
         * @param  {mixed}  obj Object to test.
         * @return {Boolean}
         */
        isNum: isNum,

        /**
         * Test for a boolean.
         * @method
         * @param  {mixed}  obj Object to test.
         * @return {Boolean}
         */
        isBool: isBool,

        /**
         * Test for an array.
         * @method
         * @param  {mixed}  obj Object to test.
         * @return {Boolean}
         */
        isArray: Array.isArray || isArray,

        /**
         * Test for a DOM object (HTMLElement or DocumentFragment).
         * @method
         * @param  {mixed}  obj Object to test.
         * @return {Boolean}
         */
        isDom: isDom,

        /**
         * Convert `arguments` to an array.
         * @param  {object} args Arguments object.
         * @return {array} Arguments
         */
        args : function(args)
        {
            return Array[proto].slice.apply(args);
        },

        /**
         * Get a value [deep] in an object.
         * @param  {object} obj Object to get a value from.
         * @param  {string|array} path Property path, e.g. "foo.bar.baz", or ["foo", "bar", "baz"].
         * @param  {mixed} [def] Default value if nothing is found.
         * @return {mixed} Value or default.
         */
        get : function(obj, path, def)
        {
            var valid = isObj(obj),
                props = resolvePath(path),
                pl = valid ? props[len] : 0,
                p = 0;
            
            for (; p<pl && obj; p++)
            {
                obj = obj[props[p]];
            }
            
            return !valid || !pl || isUnd(obj) ? def : obj;
        },

        /**
         * Set a value [deep] in an object.
         * @param  {object} obj Object to set a value on.
         * @param  {string|array} path Property path, e.g. "foo.bar.baz" or ["foo", "bar", "baz"]
         * @param  {mixed} val Value to set.
         * @param {boolean} [conditional=false] Only set value if one is not already present.
         * @return {object} Object.
         */
        set : function(obj, path, val, conditional)
        {
            var props = isObj(obj) ? resolvePath(path) : [],
                prop,
                pl = props[len],
                p = 0;
            
            for (; p<pl; p++)
            {
                prop = props[p];
                if (!obj[owns](prop) || (p === pl-1 && !conditional)) {
                    obj[prop] = p < pl-1 || isUnd(val) ? {} : val;
                }
                obj = obj[prop];
            }
            
            return obj;
        },

        /**
         * Pick keys from an object to generate a new object.
         * @param  {object} obj Object to get values from.
         * @param  {object} keys Object containing the desired keys.
         * @return {object|boolean} New object or false on error.
         */
        remix : function(obj, keys)
        {
            if (!isObj(obj) || !isObj(keys)) {
                return false;
            }
            
            var result = {};
            
            util.each(keys, function eachKey(srcpath, tgtpath) {
                util.set(result,
                    (srcpath && srcpath.path) || srcpath || tgtpath,
                    util.get(obj, tgtpath, srcpath && srcpath.def)
                );
            });
            
            return result;
        },

        /**
         * Merge properties from one object to another.
         * @param  {object} mergeTo Object to merge to.
         * @param  {object} mergeFrom Object to merge from.
         * @param  {object} [options] Merge options.
         * @param  {bool} [options.clone=false] Clone the object rather than augment.
         * @param  {bool} [options.shallow=false] Shallow merge.
         * @return {object}
         */
        merge : function(mergeTo, mergeFrom, options)
        {
            var clone = options && options.clone,
                shallow = options && options.shallow,
                val;

            if (clone) {
                mergeTo = util.merge({}, mergeTo);
            }

            if (isObj(mergeTo) && isObj(mergeFrom)) {
                for (var prop in mergeFrom) {
                    if (mergeFrom[owns](prop)) {
                        val = mergeFrom[prop];
                        if (!shallow && isObj(val)) {
                            mergeTo[prop] = isArray(val) ? val.slice() : util.merge(
                                mergeTo[prop] || {}, val, clone
                            );
                        } else {
                            mergeTo[prop] = val;
                        }
                    }
                }
            }

            return mergeTo;
        },

        /**
         * Clone an object.
         * @param  {object} obj Object to clone.
         * @param  {bool} [shallow=false] Whether to create a shallow clone.
         * @return {object} Cloned object.
         */
        clone : function(obj, shallow)
        {
            return util.merge({}, obj, {clone: true, shallow: shallow});
        },
 
        /**
         * Apply a function to each value in an array or object.
         * @param  {object|array} obj Object or array to apply to.
         * @param  {function} fn Function to apply which should expect `value`, `index`, and `obj` arguments.
         */
        each : function(obj, fn)
        {
            if (isFunc(fn)) {
                var o;
                if (isArray(obj)) {
                    for (o = 0, ol = obj[len]; o<ol; o++) {
                        fn(obj[o], o, obj);
                    }
                } else if (isObj(obj)) {
                    for (o in obj) {
                        if (obj[owns](o)) {
                            fn(obj[o], o, obj);
                        }
                    }
                }
            }
        },

        /**
         * Extend one class with another.
         * @param  {function} target Target class.
         * @param  {function} source Source class.
         * @param  {object} [methods] Additional methods keyed by method name.
         */
        extend : function(target, source /*, methods, methods, methods...*/)
        {
            var c = 'constructor',
                p = 'parent',
                methods = util.args(arguments).slice(2);
            
            target[proto] = new source();
            target[proto][c] = target;
            target[p] = source[proto];
            target[p][c] = source;
            
            // merge methods to prototype
            util.each(methods, function(m) {
                util.merge(target[proto], m);
            });
        },

        /**
         * Bind a function to a particular scope (`this`).
         * @param  {function} fn Function to bind.
         * @param  {object} [obj=window] Scope object (`this` when function executes).
         * @param  {array} [prefill] Prefill arguments.
         * @param  {array} [postfill] Postfill arguments.
         * @return {function} Bound function.
         */
        bind : function(fn, obj, prefill, postfill)
        {
            return function() {
                return fn.apply(obj || win, [].concat(prefill || [], util.args(arguments), postfill || []));
            };
        },

        /**
         * Capitalize a string of text.
         * @param  {string} str String to capitalize.
         * @return {string} Capitalized string.
         */
        capitalize : function(str)
        {
            if (isStr(str) && str) {
                str = str.charAt(0).toUpperCase() + (str[len] > 1 ? str.substr(1) : "");
            }
            return str;
        },

        /**
         * Trim whitespace from the beginning and ending of a string.
         * @param  {string} str String to trim.
         * @return {string} Trimmed string.
         */
        trim : function(str)
        {
            return str.replace(regexTrim, '');
        },

        /**
         * Get a CSS property from a DOM Node.
         * @param  {object} obj DOM Node to get a CSS property from.
         * @param  {string} style CSS property in camelCase.
         * @param  {string} [def] Default value if property is not set.
         * @return {string} Property value.
         */
        getStyle : function(obj, style, def)
        {
            return util.get(obj, 'style.' + style, def);
        },

        /**
         * Set a CSS property on a DOM Node.
         * @param  {object} obj DOM Node to set a CSS property on.
         * @param  {string} style CSS property in camelCase.
         * @param  {string} val Property value. Note that "px" will automatically be appended to numeric values.
         * @param  {boolean} [resolve=false] Resolve vendor prefix.
         */
        setStyle : function(obj, prop, val, resolve)
        {
            var objStyle = obj ? obj.style : null;
            if (objStyle) {
                if (resolve) {
                    prop = util.resolvePrefix(prop, objStyle);
                }
                objStyle[prop] = isNum(val) && prop !== 'zIndex' ? val + 'px' : val;
            }
        },

        /**
         * Set multiple CSS properties on a DOM Node.
         * @param  {object} obj DOM Node to set CSS properties on.
         * @param  {string} styles Object containing key/values for CSS properties in camelCase.
         * @param  {boolean} [resolve=false] Resolve vendor prefix.
         * @see setStyle
         */
        setStyles : function(obj, styles, resolve)
        {
            if (isObj(styles)) {
                for (var style in styles) {
                    util.setStyle(obj, style, styles[style], resolve);
                }
            }
        },

        /**
         * Get the vendor prefix for the current browser.
         * @param  {string} prop CSS property to test.
         * @param  {boolean} [forCss=false] Return CSS formatting (e.g. "-moz-" instead of "Moz"). 
         * @return {string} Vendor prefix.
         */
        getVendorPrefix : function(prop, forCss)
        {
            // resolve vendor prefix on first call
            if (vendorPrefix === null)
            {
                util.each(vendors, function(vendor)
                {
                    if (vendor + util.capitalize(prop || 'transform') in docStyle) {
                        vendorPrefix = vendor;
                        vendorPrefixCss = '-' + vendor.toLowerCase() + '-';
                    }
                });
            }
            
            return forCss ? vendorPrefixCss : vendorPrefix;
        },
        
        // for unit testing
        resetPrefix : function(val)
        {
            vendorPrefix = val || null;
        },

        /**
         * Get the vendor prefixed property name.
         * @param  {string} prop CSS property in dash-case to prefix.
         * @return {string} Vendor prefix.
         * @todo  Test that the property is actually prefixed.
         */
        resolveProperty : function(prop)
        {
            return util.getVendorPrefix(null, true) + prop;
        },

        /**
         * Get the vendor prefixed property name.
         * @param  {string} prop CSS property in camelCase to resolve.
         * @param {object} [obj] Optional DOM object to test property against.
         * @param {boolean} [lower] Use camelCase instead of CapitalCase.
         * @return {string} Prefixed property.
         */
        resolvePrefix : function(prop, obj, lower)
        {
            if (obj || prop.substr(0, 5) === 'trans')
            {
                var prefix = util.getVendorPrefix(prop),
                    exception = util.get(vendorExceptions, prefix + '.' + prop),
                    prefixed;

                obj = obj || docStyle;

                if (exception) {
                    prop = exception;
                } else {
                    prefixed = (lower && prefix ? prefix.toLowerCase() : prefix || '') + util.capitalize(prop);
                }
                
                prop = prefixed && prefixed in obj ? prefixed : prop;
            }
            
            return prop;
        },

        /**
         * Test if a DOM Node has a particular class.
         * @param  {object}  el DOM Node to check.
         * @param  {string}  class Class name to check for.
         * @return {boolean}
         */
        hasClass : function(el, cl)
        {
            return clRegex(cl).test(util.get(el, cln));
        },

        /**
         * Add a class to DOM Node.
         * @param {object} el DOM Node to add a class to.
         * @param {string} class The class to add.
         */
        addClass : function(el, cl)
        {
            if (!util.hasClass(el, cl)) {
                util.setClass(el, util.trim(util.get(el, cln) + ' ' + cl));
            }
        },

        /**
         * Set the class on a DOM Node.
         * @param {object} el DOM Node to set the class on.
         * @param {string} class The class to set.
         */
        setClass : function(el, cl)
        {
            util.set(el, cln, cl);
        },

        /**
         * Remove a class from a DOM Node.
         * @param {object} el DOM Node to remove a class from.
         * @param {string} class The class to remove.
         */
        delClass : function(el, cl)
        {
            var c = util.get(el, cln),
                regex;
            
            if (c) {
                regex = clRegex(cl);
                util.set(el, cln, c.replace(regex, '$1$2'));
            }
        },

        /**
         * Get an element by name. 
         * @param  {string} name Node name.
         * @return {object} DOM Node or null.
         */
        byName : function(n)
        {
            var el = doc.getElementsByName(n);
            return el && el[0] || null;
        },

        /**
         * Get an array of elements by tag name.
         * @param  {string} tag Tag name.
         * @param  {object} [parent=document] Optional DOM Node to start from.
         * @return {array} An array which will be empty if nothing is found
         */
        byTag : function(tag, parent)
        {
            var collection = (parent || doc).getElementsByTagName(tag);
            return toArray(collection);
        },

        /**
         * Get an element by id.
         * @param  {string} id Element ID.
         * @return {object} DOM Node or null.
         */
        byId : function(id)
        {
            return doc.getElementById(id);
        },

        /**
         * Get an array of elements by class name.
         * @param  {string} class Class name(s), space separated.
         * @param  {object} [parent=document] Optional DOM Node to start from.
         * @return {array} Array of elements.
         */
        byClass : function(cln, parent)
        {
            var els = [],
                collection = (parent || doc).getElementsByClassName(cln) || [],
                cl = collection[len],
                c = 0;

            for (; c<cl; c++) {
                els.push(collection.item(c));
            }

            return els;
        },

        /**
         * Get a single element by CSS selector.
         * @param  {string} selector Selector(s), comma separated.
         * @param  {object} [parent=document] Optional DOM Node to start from.
         * @return {array} Element or null.
         */
        bySelector : function(s, parent)
        {
            return (parent || doc).querySelector(s);
        },

        /**
         * Get an array of elements by CSS selector.
         * @param  {string} selector Selector(s), comma separated.
         * @param  {object} [parent=document] Optional DOM Node to start from.
         * @return {array} Array of elements.
         */
        bySelectorAll : function(s, parent)
        {
            var collection;

            try {
                collection = (parent || doc).querySelectorAll(s);
            } catch (e) {
                collection = [];
            }

            return toArray(collection);
        },

        /**
         * Safely append one element to another.
         * @method
         * @param  {HTMLElement|DocumentFragment} el Node to append to.
         * @param  {HTMLElement|DocumentFragment} child Node to append.
         */
        append: append,

        /**
         * Safely replace one element with another.
         * @param  {HTMLElement} old Element to replace.
         * @param  {HTMLElement} new Element to replace with.
         */
        replace: function(oldEl, newEl)
        {
            if (isDom(oldEl) && isDom(newEl)) {
                oldEl.parentNode.replaceChild(newEl, oldEl);
                return newEl;
            }
        },

        /**
         * Set attributes and properties on an element.
         * @param {HTMLElement|DocumentFragment} el Node
         * @param {object|string} attrs A string or key/value pairs including special handling for:
         * @param {string} [attrs.className] Class name.
         * @param {string} [attrs.innerHTML] Content to set using innerHTML (also how `attrs`is handled when a string ).
         * @param {HTMLElement|DocumentFragment} [attrs.parentNode] Parent node to append to.
         * @param {array|HTMLElement|DocumentFragment} [attrs.children] Array of nodes or a single node to append.
         * @param {object} [attrs.styles] Style object which is passed to `setStyles`.
         * @param {string} [attrs.&lt;attr&gt;] Anything else will go through `el.setAttribute`.
         * @param {object} [events] Optional collection of listener functions keyed by event name, as passed to `listen`.
         * @return {object} The DOM Node.
         * @see setAttrs
         * @see listen
         */
        setAttrs : function(el, attrs, events)
        {
            if (el) {
                if (attrs) {
                    var attr, attribute;
                    if (isStr(attrs)) {
                        attrs = {innerHTML: attrs};
                    }
                    for (attr in attrs) {
                        attribute = attrs[attr];
                        switch(attr)
                        {
                            case cln:
                            case innerHtml:
                                el[attr] = attribute;
                            break;
                            case 'parentNode':
                                append(attribute, el);
                            break;
                            case 'styles':
                                util.setStyles(el, attribute, true);
                            break;
                            case 'children':
                                if (isDom(attribute)) {
                                    append(el, attribute);
                                } else if (isArray(attribute)) {
                                    util.each(attribute, util.bind(append, null, [el]));
                                }
                            break;
                            case 'before':
                            case 'front':
                            case 'back':
                            case 'after':
                                util.adj(el, attribute, attr);
                            break;
                            case 'remove':
                                if (attribute) {
                                    util.remove(el);
                                    return;
                                }
                            break;
                            default:
                                el.setAttribute(attr, attribute);
                            break;
                        }
                    }
                }
                if (events) {
                    for (var ev in events) {
                        util.listen(el, ev, events[ev]);
                    }
                }
            }
            return el;
        },

        /**
         * Create a new element.
         * @param  {string} el Tag name.
         * @param  {object} [attrs] Optional attributes passed to setAttrs.
         * @param  {object} [events] Optional events passed to setAttrs.
         * @see    setAttrs
         * @return {object} New DOM Node.
         */
        create : function(el, attrs, events)
        {
            el = doc.createElement(el);
            return util.setAttrs(el, attrs, events);
        },

        /**
         * Create a document fragment.
         * @param  {string|node} [content] Optional html or DOM node to append to the fragment.
         *  DOM nodes will be cloned prior to append.
         * @return {object} Document fragment.
         */
        frag : function(content)
        {
            var frag = doc.createDocumentFragment();
            if (isDom(content)) {
                append(frag, content[clone](true));
            } else if (isStr(content)) {
                var d = util.create('div', {innerHTML: content}),
                    ch = d.childNodes,
                    cl = ch[len],
                    c;

                for (c = 0; c < cl; c++) {
                    append(frag, ch[c][clone](true));
                }
            }
            return frag;
        },

        /**
         * Insert markup relative to a node (insertAdjacentHTML).
         * @param  {node} node DOM node to insert relative to.
         * @param  {string} content The content to insert.
         * @param  {string} where Where to insert; one of 'before' (beforeBegin), 'front' (afterBegin),
         *          'back' (beforeEnd), or 'after' (afterEnd).
         */
        adj : function(node, content, where)
        {
            if (isDom(node) && isStr(content)) {
                switch (where) {
                    case 'before':  where = 'beforeBegin'; break;
                    case 'front':   where = 'afterBegin'; break;
                    case 'back':    where = 'beforeEnd'; break;
                    case 'after':   where = 'afterEnd'; break;
                }
                node.insertAdjacentHTML(where, content);
            }
        },

        /**
         * Use a document fragment or node to render a new piece of DOM.
         * @param  {DocumentFragment|HTMLElement} frag Document fragment to clone or element to render to.
         * @param  {object} data Data to render.
         * @return {DocumentFragment|HTMLElement} Cloned and rendered fragment ready to append to your document or element which was rendered to.
         * @see {@link https://github.com/gzip/js-simple-util/tree/master/docs/render/|Examples}
         */
        render : function(frag, data)
        {
            var node = frag && frag.nodeType === 11 ? frag[clone](true) : frag;
            util.each(data, function eachData(attrs, selector) {
                var target = selector === 'root' ? [node] : util.bySelectorAll(selector, node),
                    num = target[len],
                    firstTarget,
                    targetFrag,
                    parent,
                    nthTarget,
                    index = 0,
                    subRender,
                    attr;

                if (num) {
                    firstTarget = target[0];
                    if (isArray(attrs)) {
                        // clone early so modifications aren't picked up
                        targetFrag = firstTarget[clone](true);
                        parent = firstTarget.parentNode;
                        while (attrs.length) {
                            attr = attrs.shift();
                            nthTarget = target[index];

                            // call recursively for subrenders
                            subRender = attr.render;
                            if (subRender) {
                                if (nthTarget) {
                                    util.render(nthTarget, subRender);
                                } else {
                                    append(
                                        parent,
                                        util.render(targetFrag[clone](true), subRender)
                                    );
                                }
                                delete attr.render;
                            }

                            if (!subRender || Object.keys(attr).length) {
                                if (nthTarget) {
                                    util.setAttrs(nthTarget, attr);
                                } else {
                                    append(
                                        parent,
                                        util.setAttrs(targetFrag[clone](true), attr)
                                    );
                                }
                            }

                            index++;
                        }

                        // prune any nodes left over
                        while (index < num) {
                            util.remove(target[index]);
                            index++;
                        }
                    } else {
                        util.setAttrs(firstTarget, attrs);
                    }
                }
            });
            return node;
        },

        /**
         * Remove an element from the DOM.
         * @param  {object} el DOM Node
         */
        remove : function(el)
        {
            util.parent(el).removeChild(el);
        },

        /**
         * Get the parent or ancestor of a given element.
         * @param  {object} el DOM Node.
         * @param  {int|function} [level=1] The number of levels to traverse or a function to test each node against.
         *         The function should return truthy if the desired node is located. Traversal will stop
         *         without a result and return `undefined` if the function returns -1.
         * @return {object} DOM Node or null.
         */
        parent : function(el, level)
        {
            level = level || 1;
            var isFn = isFunc(level),
                fnResult,
                result = null;

            while ((el = el.parentNode)) {
                if (isFn) {
                    fnResult = level(el);
                    if (fnResult) {
                        if (fnResult !== -1) {
                            result = el;
                        }
                        break;
                    }
                } else if (--level === 0) {
                    result = el;
                    break;
                }
            }

            return result;
        },

        /**
         * Add a script to the page.
         * @param {string} src Script src.
         * @param {object} [opts] Optional listeners for "load" and/or "error".
         */
        addScript : function (src, opts)
        {
            var script = util.create('script', {src:src}),
                head = util.byTag('head').pop();

            opts = opts || {};
            util.listen(script, 'load', opts.load || function() { util.remove(this); });
            if (opts.error) {
                util.listen(script, 'error', opts.error);
            }

            append(head || doc, script);
        },

        /**
         * Make an XHR request.
         * @param  {string} url URL.
         * @param  {function} [callback] Callback function which should expect `error`,
                   `response` (text or JSON object), and `request` (XMLHttpRequest object) arguments.
         * @param  {object} [opts] Options containing any of: 
         * @param  {string} [opts.data] Data to send in the request body.
         * @param  {object} [opts.headers] Key/value collection of headers to include in the request.
         * @param  {object} [opts.json] Object which will be JSON encoded and sent in the request body (see data).
         * @param  {string} [opts.method='GET'] HTTP method to use in the request.
         * @param  {object} [opts.parseJson] Parse the response as JSON. This will happen by default if the
         *         `Content-Type` response header contains "json".
         * @param  {object} [opts.props] Arbitrary properties set directly to the `XMLHttpRequest` object.
         * @return {object} XMLHttpRequest object.
         */
        request : function (url, cb, opts)
        {
            opts = opts || {};
            var req = new XMLHttpRequest(),
                method = opts.method || 'GET',
                headers = opts.headers || {},
                data = opts.data || null,
                json = opts.json,
                cType = 'Content-Type';
            
            // temp bc
            if (cb && cb.callback) {
                cb = cb.callback;
            }
            
            if (!isUnd(json)) {
                if (!headers[cType]) {
                    headers[cType] = 'application/json';
                }
                try {
                    data = JSON.stringify(json);
                } catch(e) {
                    if (cb) {
                        cb(e, null, req);
                    }
                }
            }
            
            if (url)
            {
                req.open(method, url);
                
                util.each(headers, function(value, key)
                {
                    req.setRequestHeader(key, value);
                });
                util.each(opts.props, function(value, key)
                {
                    req[key] = value;
                });
                
                req.onreadystatechange = function()
                {
                    var resp, status, headers, type;
                    if (req.readyState === 4) {
                        status = req.status;
                        resp = req.responseText;
                        type = req.getResponseHeader(cType) || '';
                        if (opts.parseJson || type.match(/^[a-z\/-]+json/im)) {
                            try {
                                resp = JSON.parse(resp);
                            } catch(e) {
                                if (cb) {
                                    cb(e, resp, req);
                                }
                            }
                        }
                        // TODO follow redirects? (opts.follow, opts.depth)
                        if (status < 300 & status > 199) {
                            if (cb) {
                                cb(null, resp, req);
                            }
                        } else if (cb) {
                            cb({status: status, message: 'Non-200 returned.'}, resp, req);
                        }
                    }
                };
                req.send(data);
            }
            
            return req;
        },

        /**
         * Listen to an event.
         * @param  {object}   obj DOM Node to listen for events on.
         * @param  {string}   type Event type, e.g. "click".
         * @param  {function} fn Function to call when event fires.
         */
        listen : function(obj, type, fn)
        {
            if(!isObj(obj)) return;
            
            var add = 'addEventListener',
                attach = 'attachEvent',
                ev = 'on'+type;
            
            if (obj[add]) {
                obj[add](type, fn, false);
            } else if (obj[attach]) {
                obj[attach](ev, function() { fn(window.event); } );
            } else {
                obj[ev] = fn;
            }
        },

        /**
         * Process an event.
         * @param  {object} e Event object.
         * @param  {boolean} [prevent] Prevent default.
         * @param  {boolean} [stop] Stop propagation.
         * @return {object} Event target.
         */
        processEvent : function(e, prevent, stop)
        {
            e = e || window.event;
            var el = e.target || e.srcElement;
            if (prevent) {
                if (e.preventDefault) {
                    e.preventDefault();
                    if (stop) {
                        e.stopPropagation();
                    }
                }
                e.returnValue = false;
                if (stop) {
                    e.cancelBubble = true;
                }
            }
            return el;
        },

        /**
         * Parse a query string into an object of key/value pairs.
         * @param str Optional query string, otherwise use current URL.
         *        Note that parameters without a value will be assigned a value of 1.
         * @return {object} Query params object.
         */
        parseQuery : function(str)
        {
            var params = {},
                split = 'split',
                dec = decodeURIComponent,
                query = str || location.href[split](/[?#]/)[1];

            if (query) {
                query = query[split](/&/);
                for (var q in query) {
                    q = query[q][split](/=/);
                    params[dec(q[0])] = dec(q[1] || '') || 1;
                }
            }

            return params;
        },

        /**
         * Build a query string from an object containing key/value pairs.
         * @param {object} object containing key/value pairs which will be url encoded.
         * @return {string} Query params string.
         */
        buildQuery : function(params)
        {
            var result = '',
                enc = encodeURIComponent;

            util.each(params, function (val, key) {
                result += (result ? '&' : '') + enc(key) + '=' + enc(val);
            });

            return result;
        },

        /**
         * Get the scroll position of the current window.
         * @return {integer} Scroll position.
         */
        getScroll : function ()
        {
            var scrollTop = 'scrollTop';
            return docEl[scrollTop] || docBody[scrollTop];
        },

        /**
         * Get the  offset position of an element.
         * @param  {object} el DOM Node to get an offset for.
         * @return {object} Object containing "x" and "y" properties.
         */
        getOffset : function(el)
        {
            var parentNode = el,
                offsetLeft = 'offsetLeft',
                offsetTop = 'offsetTop',
                x = 0,
                y = 0;
            
            if (el) {
                x = el[offsetLeft];
                y = el[offsetTop];
                while((parentNode = parentNode.offsetParent)) {
                    x += parentNode[offsetLeft];
                    y += parentNode[offsetTop];
                }
            }
            
            return {x: x, y: y};
        },

        /**
         * Listen for animation frame (requestAnimationFrame).
         * @param {function} fn Function to execute for each frame.
         * @param {object} [scope=window] Scope to execute function in.
         * @param {mixed} [args] Any further arguments get passed to the function.
         *        Note that the last argument will be the timestamp of when the frame is executed.
         */
        onFrame : function (fn, scope, args)
        {
            if (args || scope) {
                fn = util.bind(fn, scope, util.args(arguments).slice(2));
            }
            return raf(fn);
        },

        /**
         * Cancel animation frame (cancelAnimationFrame).
         * @param {function} fn Function to cancel.
         */
        cancelFrame : function ()
        {
        }
    };
}();

var util = SimpleUtil;
if (typeof module !== 'undefined') {
    module.exports = util;
}

util.setDoc(win.document);

util.getVendorPrefix();

function wrap(name) {
    return function(f){ return win[util.resolvePrefix(name, win, true)](f); };
}

var raf = wrap('requestAnimationFrame');

util.cancelFrame = wrap('cancelAnimationFrame');

})(typeof window !== 'undefined' ? window : global);
