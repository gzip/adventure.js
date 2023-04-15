// Copyright (c) 2016 Gamaiel Zavala. All rights reserved. Copyrights licensed under the MIT License.
// See the accompanying LICENSE file for terms.

(function(){

var util = SimpleUtil;

AdventureAsset = function(path, opts, cb)
{
    var self = this;
    self.coords = [0,0];
    self.load(path, opts || {}, cb);
    self.attrs = {};

    // create debug tile
    if (opts && opts.debug) {
        self.createDebugTile(opts);
    }
};

AdventureAsset.prototype =
{
    assetDims: [0, 0],
    layerPoint: [0, 0],
    coords: [],
    bounds: null,
    attrs: {},

    load: function(path, opts, cb)
    {
        var self = this,
            img = path ? util.create('img', {
                src: path,
                style: 'position:absolute; top:-100em;',
                parentNode: document.body
            }) : null,
            layerPoint = opts.layerPoint || [],
            bounds = opts.bounds;

        if (util.isArray(bounds) && bounds.length === 4) {
            self.bounds = bounds;
        }

        // create the container early so it's available downstream
        self.container = util.create('div', util.merge({
            styles: {
                position: 'absolute',
                background: path ? 'url(' + path + ') no-repeat' : '',
                imageRendering: util.resolvePropertyValue('image-rendering', 'pixelated')
            },
            parentNode: opts.parentNode || document.body
        }, (opts || {}).attrs, {shallow: true}));

        if (util.isArray(opts.coords)) {
            self.setXY(opts.coords[0], opts.coords[1]);
        }

        // for comparing z index
        self.layerPoint = [
            // use raw coords since x, y include bounds
            (layerPoint[0] || 0) + self.coords[0],
            (layerPoint[1] || 0) + self.coords[1]
        ];

        // TODO self.handleImgLoad or self.fire('imageload')
        if (img) {
            img.onload = function()
            {
                self.assetDims = [img.width, img.height];

                util.setStyles(self.container, {
                    width: self.assetDims[0],
                    height: self.assetDims[1]
                });

                if (util.isFunc(cb)) {
                    cb(null, self);
                }

                util.remove(img);
            };
        } else if (util.isFunc(cb)) {
            cb(null, self);
        }
    },

    getWidth: function()
    {
        var self = this,
            bounds = self.bounds;
        return bounds ? bounds[2] - bounds[0] : self.assetDims[0];
    },

    getHeight: function()
    {
        var self = this,
            bounds = self.bounds;
        return bounds ? bounds[3] - bounds[1] : self.assetDims[1];
    },

    getX: function()
    {
        var self = this,
            bounds = self.bounds;
        return self.coords[0] + (bounds ? bounds[0] : 0);
    },

    getY: function()
    {
        var self = this,
            bounds = self.bounds;
        return self.coords[1] + (bounds ? bounds[1] : 0);
    },

    getXY: function()
    {
        var self = this;
        return [self.getX(), self.getY()];
    },

    setX: function(x, rel)
    {
        var self = this,
            bounds = self.bounds,
            offset = rel ? self.coords[0] : 0;

        x += offset + (bounds ? bounds[0] : 0);
        util.setStyle(self.container, 'left', x);
        self.coords[0] = x;
    },

    setY: function(y, rel)
    {
        var self = this,
            bounds = self.bounds,
            offset = rel ? self.coords[1] : 0;

        y += offset + (bounds ? bounds[1] : 0);
        util.setStyle(self.container, 'top', y);
        self.coords[1] = y;
    },

    setXY: function(x, y, rel)
    {
        var self = this;
        self.setX(x, rel);
        self.setY(y, rel);
    },

    getBounds: function()
    {
        var self = this,
            bounds = self.bounds,
            boardOffset = self.getBoardOffset(),
            offset = util.getOffset(self.container),
            x = offset.x - boardOffset.x + (bounds ? bounds[0] : 0),
            y = offset.y - boardOffset.y + (bounds ? bounds[1] : 0),
            w = self.getWidth(),
            h = self.getHeight();

        // self.container.getBoundingClientRect()
        return [x, y, x + w, y + h];
    },

    remove: function()
    {
        return this.container && util.remove(this.container);
    },

    collidesWith: function(b1)
    {
        var self = this,
            b2 = self.getBounds(),
            left = 0,
            top = 1,
            right = 2,
            bottom = 3;

        if (b1 instanceof AdventureAsset) {
            b1 = b1.getBounds();
        }

                // bounds 1′s bottom edge is above bounds 2′s top edge
        return !(  b1[bottom] < b2[top]
                // bounds 1′s top edge is under bounds 2′s bottom edge
                || b1[top] > b2[bottom]
                // bounds 1′s left edge is to the right of bounds 2′s right edge
                || b1[left] > b2[right]
                // bounds 1′s right edge is to the left of bounds 2′s left edge
                || b1[right] < b2[left]
                );
    },

    getStyle : function(style, def)
    {
        return util.getStyle(this.container, style, def);
    },

    setStyle : function(style, val, resolve)
    {
        return util.setStyle(this.container, style, val, resolve);
    },

    setStyles : function(styles, resolve)
    {
        return util.setStyles(this.container, styles, resolve);
    },

    is: function(a)
    {
        return !!this.get(a);
    },

    isNot: function(a)
    {
        return !this.is(a);
    },

    get: function(key, def)
    {
        var self = this,
            method = 'get' + util.capitalize(key),
            value;

        if (util.isFunc(self[method])) {
            value = self[method](value);
        } else {
            value = self.attrs[key] || self.opts && self.opts[key];
        }

        if (util.isUnd(value)) {
            value = def;
        }

        return value;
    },

    set: function(key, value)
    {
        var self = this,
            // TODO self.setters[key] ||
            method = 'set' + util.capitalize(key);

        if (util.isUnd(value)) {
            value = true;
        }

        // TODO addSetter(key,fn)
        if (util.isFunc(self[method])) {
            value = self[method](value);
        }

        self.attrs[key] = value;
    },

    unset: function(key)
    {
        var self = this,
            method = 'unset' + util.capitalize(key);

        if (util.isFunc(self[method])) {
            self[method]();
        }

        self.attrs[key] = false;
    },

    // TODO setAll?
    setAttrs: function(attrs)
    {
        var self = this
        util.each(attrs, function(value, name)
        {
            if (value === false) {
                self.unset(name, value);
            } else {
                self.set(name, value);
            }
        });
    },

    serialize: function()
    {
    },

    unserialize: function(savedAttrs)
    {
        this.setAttrs(savedAttrs);
    },

    // TODO get rid of styles and handle thru code
    mirror: function(m)
    {
        var self = this,
            method = m === false ? 'delClass' : 'addClass';
        util[method](self.container, 'mirror');
    },

    flip: function(m)
    {
        var self = this,
            method = m === false ? 'delClass' : 'addClass';
        util[method](self.container, 'flip');
    },

    createDebugTile: function(opts)
    {
        var self = this;
        self.debugTile = util.create('div',
            {
                parentNode: self.container,
                styles: {
                    position: 'absolute',
                    transitionProperty: 'opacity',
                    transitionDuration: '.5s, 1s, 0.01s, 0.01s',
                    transitionDelay: '0s, 0s, 0s, 0s'
                }
            },
            {
                transitionend: function(e)
                {
                    //console.log(e, this, e.propertyName);
                    var prop = e.propertyName,
                        value;

                    switch(true){
                        case prop == 'opacity':
                            // fallthru
                        case util.get(e.target, 'style.opacity') > 0:
                            value = 0;
                        break;
                        default: value = 1;
                    }

                    util.setStyle(this, 'opacity', value);
                }
            }
        );
    },

    // supplemented by Adventure constructor
    getBoardOffset: function()
    {
    }
};

}());
