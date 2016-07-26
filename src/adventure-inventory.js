// Copyright (c) 2016 Gamaiel Zavala. All rights reserved. Copyrights licensed under the MIT License.
// See the accompanying LICENSE file for terms.

(function(){

var util = SimpleUtil;

AdventureInventory = function(path, opts, cb)
{
    var self = this;

    self.assetDims = util.get(opts, 'dims', [480, 30]);
    
    // holds references to removed items
    self.limbo = util.create('div', {});
    
    AdventureInventory.parent.constructor.apply(self, [path, opts, function (err, asset)
    {
        util.setStyles(self.container, {
            width: self.assetDims[0],
            height: self.assetDims[1]
        });

        self.setY(210);

        if (util.isFunc(cb)) {
            cb(err, self);
        }
    }]);
};

util.extend(AdventureInventory, AdventureAsset,
{
    items: [],
    //boardDims: [0, 0],
    
    count: function()
    {
        return this.items.length;
    },
    
    add: function(obj)
    {
        var self = this,
            player = self.getPlayer();
        
        obj.opts.pocketable = true;
        if (obj.isNot("pocketed")) {
            obj.set('pocketed');
        }
        //util.addClass(obj.container, 'pocketed');
        
        self.items.push(obj);
        self.selectItem(obj);
        
        util.append(self.container, obj.container);

        return true;
    },
    
    get: function(name)
    {
        var self = this,
            i = self.indexOf(name);
        
        return i !== -1 ? self.items[i] : null;
    },
    
    remove: function(name)
    {
        var self = this,
            i = self.indexOf(name),
            item = self.get(name);
        
        if (i !== -1) {
            self.items.splice(i, 1);
            item.remove();
            self.selectItem(null);
        }
    },
    
    contains: function(name)
    {
        return this.indexOf(name) !== -1;
    },
    
    indexOf: function(name)
    {
        var self = this,
            items = self.items,
            i = 0, il = items.length;
        
        for(;i<il;i++){
            if(items[i].name === name){
                return i;
            }
        }
        
        return -1;
    },
    
    draw: function()
    {
        var self = this,
            items = self.items,
            nextX = 0,
            containerHeight = parseInt(util.getStyle(self.container, 'height'), 10);
        
        items.forEach(function(item, index){
            item.setXY(nextX + 10, Math.floor(
                (containerHeight - item.getHeight()) / 2
            ));
            nextX += item.getWidth() + 10;
        });
    },
    
    clear: function()
    {
        var self = this;
        
        self.items.forEach(function(item){
            item.unset('pocketed');
            util.append(self.limbo, item.container);
        });
        
        self.items = [];
    }
});

}());
