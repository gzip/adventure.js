// Copyright (c) 2016 Gamaiel Zavala. All rights reserved. Copyrights licensed under the MIT License.
// See the accompanying LICENSE file for terms.

(function(){

var util = SimpleUtil;

AdventureItem = function(path, opts, cb)
{
    var self = this;
    
    self.opts = opts || {};
    if (self.opts.render === false) {
        util.set(self.opts, 'attrs.parentNode', null);
    }
    
    self.listeners = {};
    
    /*
    // create wrapper and pass to sprite constructor in opts
    self.wrapper = self.opts.parentNode = util.create('div', {
        parentNode: document.body,
        className: 'adv-item'
    });
    */
    
    AdventureItem.parent.constructor.apply(self, [path, self.opts, function(err, asset)
    {
        if (util.isFunc(cb)) {
            cb(err, self);
        }
    }]);
}

util.extend(AdventureItem, AdventureSprite,
{
    name: '', // set by Adventure.create
    listeners: null,
    dialogIndices: {},
    
    on: function(eventName, fn, args)
    {
        var self = this;
        if (!self.listeners[eventName]) {
            self.listeners[eventName] = [];
        }
        self.listeners[eventName].push({fn:fn, args:args});
    },
    
    fire: function(eventName, payload)
    {
        var self = this,
            result = true,
            inv = self.getInventory(),
            selectedItem = inv.getSelectedItem(),
            listeners = util.get(self, 'listeners.' + eventName),
            method;
        
        payload = payload || {};
        payload.type = eventName;
        
        switch (eventName) {
            case 'use':
                payload.target = payload.target || (selectedItem !== self ? selectedItem : null);
            break;
        }
        
        if (eventName == 'use' && selectedItem)
        {
            // run before use
            result = selectedItem.fire('beforeuse',
                util.merge(payload, {target: self}, {clone: true, shallow: true})
            );
            
            // return early if beforeUse returned false
            if (result === false) {
                return result;
            }
            // otherwise reset result to true
            else {
                result = true;
            }
        }
        
        if(listeners)
        {
            for(var l=0, ll=listeners.length; l<ll; l++)
            {
                payload.args = listeners[l].args;
                result = result && listeners[l].fn(payload);
            }
        }
        
        if (result === true)
        {
            method = self.getActionMethod(eventName);
            if (util.isFunc(self[method])) {
                result = self[method](payload);
            }
            if (result === true) {
                self.handleDefault(payload);
            }
        }
        
        return result;
    },
    
    handleDefault: function(e)
    {
        var self = this,
            opts = self.opts,
            player = self.getPlayer(),
            eventName = e.type;

        switch(eventName)
        {
            case 'walkto':
                player.walkTo(self);
            break;
            case 'lookat':
                var desc = self.cycleDialog(self.get("description"));
                if (desc) {
                    player.say(util.isFunc(desc) ? desc() : desc);
                }
            break;
            case 'pickup':
                if(opts.pocketable)
                {
                    if(self.isNot("pocketed"))
                    {
                        // pick up the obj if the player is already in place
                        if (player.isAt(self)) {
                            self.addToInventory();
                        }
                        // otherwise walk to the place and set objective
                        else {
                            player.walkTo(self, {action: eventName, target: self});
                        }
                    }
                    else {
                        player.say(
                            "I'll use "
                            + (self.name.substr(self.name.length-1) == "s" ? "these " : "this ")
                            + self.getTitle()
                            + "."
                        );
                        self.setActive();
                    }
                }
                else
                {
                    player.say("I can't pick that up.");
                }
            break;
            case 'use':
                var target = e.target,
                    //inv = self.getInventory(),
                    //numItems = inv.count(),
                    msg;
                
                if (true/*numItems*/) {
                    if (target) {
                        if (target.name == self.name) {
                            msg = "I can't use it on itself.";
                        } else if (!e.alt) {
                            e.target = self;
                            e.alt = true;
                            target.fire(eventName, e);
                        } else {
                            msg = player.cycleDialog(["That doesn't work.", "Not so much.",
                                "Umm. No.", "What's the point.", "I don't get it.", "Come again?"], "nouse");
                        }
                    } else {
                        //msg = "Select something to use first.";
                    }
                } else {
                    msg =  "I have nothing to use.";
                }
                
                if (msg) {
                    player.say(msg);
                }
            break;
            case 'apply':
                player.say("Nothing happened.");
            break;
            case 'talkto':
                player.say(player.cycleDialog(["I can't talk to that.", "What would I say?", "Umm... hello?"], "talk"));
            break;
        }
    },
    
    getWalkTo: function()
    {
        var self = this,
            opts = self.opts,
            walkTo = opts.walkTo || [-5, parseInt(self.getHeight()/2, 10)],
            coords = self.getXY(),
            x = coords[0] + walkTo[0],
            y = coords[1] + walkTo[1];

        return [x, y];
    },
    
    cycleDialog: function(d, name, loop)
    {
        var self = this;
        if(util.isArray(d)){
            var n = name || self.name,
                dIndex = self.dialogIndices[n] || 0,
                dLen = d.length;
            
            d = d[dIndex];
            
            if(++dIndex === dLen) {
                dIndex = loop !== false ? 0 : dIndex - 1;
            }
            self.dialogIndices[n] = dIndex;
        }
        
        return d;
    },
    
    setDesc: function(d)
    {
        this.set("description", d);
    },
    
    getDesc: function()
    {
        var self = this;
        return self.get("description", self.opts.description);
    },
    
    getTitle: function()
    {
        var self = this;
        return self.attrs.title || self.opts.title || self.name;
    },
    
    setTitle: function(t)
    {
        var self = this;
        if (t && t !== self.attrs.title) {
            self.attrs.title = t;
            self.updateStatus();
        }
        return t;
    },
    
    // TODO addSetter('pocketed', bind(addToInventory))
    setPocketed: function(pocketed)
    {
        var self = this;
        if (self.isNot("pocketed")) {
            self.attrs.pocketed = true;
            return self.addToInventory();
        }
        return pocketed;
    },
    
    // supplemented by Adventure
    getInventory: function()
    {
    },
    
    addToInventory: function()
    {
    },
    
    getTileSize: function()
    {
    },
    
    setActive: function()
    {
    },
    
    getPlayer: function()
    {
    },
    
    updateStatus: function()
    {
    }
});

}());
