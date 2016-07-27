// Copyright (c) 2016 Gamaiel Zavala. All rights reserved. Copyrights licensed under the MIT License.
// See the accompanying LICENSE file for terms.

(function(){

var util = SimpleUtil,
    zIndex = 'zIndex',
    proxies = {},
    playerProxy,
    regexDialogTarget = /^\s*:([^: ]+):\s+/,
    resources = {
        game: null, board: {}, cursor: null, player: null, rooms: {},
        inventory: null, items: {}, selectedItem: null, targetItem: null, currentRoomName: null,
        saved: {}
    };

function createProxy(obj, name, methods)
{
    if(util.isStr(name) && util.isObj(obj))
    {
        if(!proxies[name])
        {
            var method, m, ml;
            methods = methods || obj.getPublicMethods();
            
            proxies[name] = {};
            
            for(m=0, ml=methods.length; m<ml; m++)
            {
                method = methods[m];
                proxies[name][method] = util.bind(obj[method], obj);
            }
        }
        
        return proxies[name];
    }
}

function getPlayer()
{
    //return createProxy(resources.player, 'player');
    var player = resources.player;
    if(player)
    {
        if(!playerProxy)
        {
            var methods = player.getPublicMethods(),
                method, m, ml;
            
            playerProxy = {};
            
            for(m=0, ml=methods.length; m<ml; m++)
            {
                method = methods[m];
                playerProxy[method] = util.bind(player[method], player);
            }
        }
        
        return playerProxy;
    }
}

function getInventory()
{
    return resources.inventory;
}

function getSelectedItem()
{
    return resources.selectedItem;
}

function getItem(name)
{
    return resources.items[name];
}

function setSelectedItem(obj)
{
    if (obj instanceof AdventureItem) {
        obj.setActive();
    } else if (obj === null) {
        resources.selectedItem = obj;
        resources.game.setAction('walkto');
    }
}

function getBoardOffset() {
    var boardContainer = resources.board.container;
    return util.getOffset(boardContainer);
}

function getBoardDims() {
    var boardAsset = resources.board.asset;
    return [boardAsset.getWidth(), boardAsset.getHeight()];
}

Adventure = function(args)
{
    var self = this;
    args = args || {};
    util.listen(window, 'keyup', util.bind(self.handleKeys, self));
    
    // create the container early so it's available downstream
    self.container = util.create('div', {
        styles: {
            position: 'absolute',
            overflow: 'hidden',
            width: args.width || '100%',
            height: args.height || '100%',
            cursor: 'none'
        },
        name: 'adv',
        parentNode: document.body
    });

    self.dialog = util.create('div',
    {
        parentNode: self.container,
        styles: {position: 'absolute', zIndex: 1500, userSelect: 'none'},
        className: 'dialog'
    });

    self.status = util.create('div',
    {
        parentNode: self.container,
        styles: {zIndex: 1000, userSelect: 'none'},
        className: 'status'
    });

    resources.game = self;
    
    AdventureAsset.prototype.getBoardOffset = getBoardOffset;
};

Adventure.prototype =
{
    index: 0,
    dialog: null,
    dialogTimer : null,
    
    actions: [
        {name: 'walkto', title: 'walk to', method: 'onWalkTo', key: 87},
        {name: 'pickup', title: 'pick up', method: 'onPickUp', key: 80},
        {name: 'use',    title: 'use',     method: 'onUse',    key: 85},
        {name: 'lookat', title: 'look at', method: 'onLookAt', key: 76},
        {name: 'talkto', title: 'talk to', method: 'onTalkTo', key: 84}
    ],
    
    actionIndex: 0,
    
    handleKeys: function(e)
    {
        var self = this,
            key = e.keyCode,
            actionName;
        
        switch (key) {
            default:
                self.actions.forEach(function(action)
                {
                    if (action.key === key) {
                        actionName = action.name;
                    }
                });
            break;
        }
        
        if (actionName) {
            self.setAction(actionName);
        }
    },
    
    setAction: function(name)
    {
        var self = this,
            cursor = resources.cursor,
            actions = self.actions,
            action,
            a = 0, al = actions.length;
        if (cursor) {
            for(; a<al; a++)
            {
                if (actions[a].name === name) {
                    
                    self.actionIndex = a;
                    cursor.setFrame(a + 1);
                    self.updateStatus();
                    
                    return a;
                }
            }
        }
    },
    
    getAction: function(key)
    {
        var self = this;
        return self.actions[self.actionIndex][key || 'name'];
    },
    
    getActionMethod: function(name)
    {
        var self = this,
            method;
        
        // check for custom name
        self.actions.forEach(function(action)
        {
            if (action.name === name) {
                method = action.method;
            }
        });
        
        // default
        if (!method) {
            switch (name) {
                case 'beforeuse':
                    method = 'onBeforeUse';
                break;
                default:
                    method = 'on' + util.capitalize(name);
            }
        }
        
        return method;
    },
    
    add: function(asset)
    {
        util.append(this.container, asset && asset.container);
    },
    
    create: function(key, type, path, opts, cb)
    {
        var self = this,
            resource,
            index,
            last = 'lastIndexOf',
            lastSlash = path ? path[last]('/') : null,
            name = path === null ? key : opts.name || path.substr(
                lastSlash + 1,
                path[last]('.') - lastSlash - 1
            ),
            item = getItem(name);
        
        opts ? null : opts = {};
        if (key !== 'board') {
            util.set(opts, 'attrs.parentNode', resources.board ? self.container : null);
        }
        
        resource = new type(path, opts, function(err, obj)
        {
            // determine z-index
            if (key === 'cursor' || key === 'inventory') {
                index = 1000;
            } else if (key === 'board') {
                index = 1;
            } else if (opts.zIndex) {
                index = opts.zIndex;
            } else {
                index = (self.index += 10);
            }
            
            // set z-index and object name
            util.setStyle(obj.container, zIndex, index);
            util.setAttrs(obj.container, {name: name});
            
            obj.container.className = 'adv-' + key;
            
            // handle room to room
            if (item) {
                item.serialize();
                resource.unserialize(item.attrs);
            }
            
            // execute callback if present
            if (util.isFunc(cb)) {
                cb(err, obj);
            }
        });
        
        if (key == 'item') {
            resource.name = name;
            resources.items[name] = resource;
        } else {
            resources[key] = resource;
        }
        
        return resource;
    },
    
    registerRoom: function(name, object, opts)
    {
        var self = this,
            opts = opts || {},
            room;
        
        util.set(opts, 'attrs.parentNode', self.container);
        
        room = self.create('board', object, opts.background, opts);
        room.init(self);
        
        resources.rooms[name] = room;
    },
    
    loadRoom: function(name)
    {
        var room = resources.rooms[name],
            player = resources.player;
        
        // remove items from previous room
        if (resources.currentRoomName && name !== resources.currentRoomName) {
            util.each(resources.items, function (item, name, items) {
                items[name].remove();
            });
        }
        
        // load room and store a named reference
        room.load(null, game);
        resources.currentRoomName = name;
        
        // supplement methods
        player.tileAt = util.bind(room.coordsToTile, self);
        player.getTileSize = function(){ return room.tileSize; };
        player.coordsToPath = util.bind(room.coordsToPath, room);
        
        // supplement methods
        room.getPlayer = getPlayer;
    },
    
    createPlayer: function(path, opts)
    {
        var self = this,
            pl = 'player',
            player = self.create(pl, AdventurePlayer, path, opts),
            board = resources.board,
            target;
        
        // supplement methods
        player.say = util.bind(self.say, self, player);
        // TODO: player.getItems instead and move getMaxZ to player
        player.getMaxZ = util.bind(self.getMaxZ, self);
        
        player.name = pl;
        
        return player;
    },
    
    getInventory: getInventory,
    
    createInventory: function(opts)
    {
        var self = this,
            inv  = self.create('inventory', AdventureInventory, null, opts);
        
        // supplement methods
        inv.getPlayer = getPlayer;
        inv.getSelectedItem = getSelectedItem;
        inv.selectItem = function(obj)
        {
            setSelectedItem(obj);
            inv.draw();
        };
        
        // supplement properties
        //inv.getBoardDims = getBoardDims;
        
        // supplement player
        resources.player.has = util.bind(inv.contains, inv);
        
        return inv;
    },
    
    createItem: function(path, opts, cb)
    {
        var self = this,
            // itemClass must extend AdventureItem TODO verify
            obj = self.create('item', opts.itemClass || AdventureItem, path, opts, cb);
        
        // supplement methods
        // TODO add to AdventureItem prototype and set properties instead?
        obj.getInventory = getInventory;
        obj.addToInventory = function(){ return resources.inventory.add(obj); };
        obj.getTileSize = function(){ return resources.board.tileSize; };
        obj.setActive = function()
        {
            resources.selectedItem = obj;
            self.setAction('use');
            self.updateStatus();
        };
        obj.updateStatus = function()
        {
            self.updateStatus();
        };
        obj.getActionMethod = util.bind(self.getActionMethod, self);
        obj.getPlayer = getPlayer;
        obj.getItem = getItem;
        obj.say = util.bind(self.say, self, obj);
        
        return obj;
    },
    
    createCursor: function(path, opts)
    {
        var self = this,
            cursor = self.create('cursor', AdventureSprite, path, opts),
            updateCursor = util.bind(self.updateCursor, self),
            // TODO rename
            boardContainer = self.container,
            boardOffset = getBoardOffset();
        
        self.resolveCursorCoords = function(e)
        {
            return [(e.clientX - boardOffset.x), (e.clientY - boardOffset.y)];
        };
        
        self.resolveCursorBounds = function(e)
        {
            var self = this,
                coords = self.resolveCursorCoords(e),
                offsets = (opts.offsets || [])[self.actionIndex] || [0,0];
            
            return [
                coords[0] + offsets[0], coords[1] + offsets[1],
                coords[0] + offsets[0], coords[1] + offsets[1]
            ];
        };
        
        util.listen(boardContainer, 'mousemove', function(e)
        {
            self.lastMove = {clientX: e.clientX, clientY: e.clientY};
            util.cancelFrame(self.mouseFrame);
            self.mouseFrame = util.onFrame(updateCursor);
        });
        
        util.listen(boardContainer, 'contextmenu', function(e)
        {
            var i = 'actionIndex';
            util.processEvent(e, true);
            self[i] = self[i] === self.actions.length - 1 ? 0 : self[i] + 1;
            cursor.setFrame(self[i] + 1);
            self.updateStatus();
        });
        
        util.listen(boardContainer, 'click', function(e)
        {
            var action = self.getAction(),
                obj = resources.targetItem,
                payload = {e: e};
            
            if(action === 'use')
            {
                var inv = resources.inventory,
                    selectedItem = inv.getSelectedItem();
                
                payload.target = obj;
                if (selectedItem && obj) {
                    selectedItem.fire(action, payload);
                }
            }
            else if (obj)
            {
                obj.fire(action, payload);
                //util.setStyle(obj.container, 'outline', '1px solid white');
            }
            else if(action === 'walkto')
            {
                var player = resources.player,
                    toX = (e.clientX - boardOffset.x),
                    toY = (e.clientY - boardOffset.y);

                player.walkTo([toX, toY]);
            }
        });
        
        util.listen(boardContainer, 'dblclick', function(e)
        {
            util.processEvent(e, true);
            boardContainer.focus();
        });
        
        self.updateStatus();
        
        return cursor;
    },
    
    say: function(obj, text)
    {
        this.showDialog(text, obj);
    },
    
    showDialog: function(text, target)
    {
        text = text || "";
        var self = this,
            dialog = self.dialog,
            className = 'dialog',
            max = Math.max,
            time = Math.min(text.length * 100, 3000),
            coords = [0, 0],
            sep = ';;',
            queue = text.split(sep),
            text = queue.shift(),
            matches = text.match(regexDialogTarget);
        
        if (matches) {
            target = resources.items[matches[1]] || resources[matches[1]] || target;
            text = text.replace(matches[0], '');
        }
        
        if (target instanceof AdventureSprite) {
            coords = target.getXY();
            className += ' ' + target.name + '-' + className;
        }
        
        util.setClass(dialog, className);
        util.setStyles(dialog, {left: max(100, coords[0]), top: max(coords[1] - 20, 0)});
        dialog.innerHTML = text;
        
        if(self.dialogTimer){
            clearTimeout(self.dialogTimer);
            self.dialogTimer = null;
        }
        
        if (text) {
            next = queue.length ? util.trim(queue.join(sep)) : '';
            self.dialogTimer = setTimeout(function() {
                self.showDialog(next, target);
            }, time);
        }
    },
    
    updateCursor: function()
    {
        var self = this,
            cursor = resources.cursor,
            player = resources.player,
            e = self.lastMove,
            coords = self.resolveCursorCoords(e);
        
        cursor.setXY(coords[0], coords[1]);
        resources.targetItem = self.getItemUnderCursor(e);
        self.updateStatus();
    },
    
    updateStatus: function()
    {
        var self = this,
            status = self.status,
            action = self.getAction(),
            selected = resources.selectedItem,
            target = resources.targetItem,
            text = self.getAction('title') + ' ';
        
        if (action === 'use') {
            if (selected) {
                text += selected.getTitle() + ' with ' +
                    (target ? target.getTitle() : '');
            }
        } else if (target) {
            text += target.getTitle();
        }
        
        if (self.lastText != text) {
            util.onFrame(function() {
                self.lastText = status.innerHTML = text;
            });
        }
    },
    
    // TODO rename eachItem?
    traverseItems: function(fn)
    {
        util.each(resources.items, fn);
    },
    
    getItemUnderCursor: function(e)
    {
        var self = this,
            cursor = resources.cursor,
            cursorContainer = cursor.container,
            cursorBounds = self.resolveCursorBounds(e),
            el, name, obj;
        
        self.traverseItems(function(o)
        {
            if (o.collidesWith(cursorBounds)) {
                obj = o;
            }
        });
        
        resources.targetItem = obj;
        
        return obj;
    },
    
    getMaxZ: function()
    {
        var objs = resources.items,
            obj,
            o,
            player = resources.player,
            playerBounds = player.getBounds(),
            playerCoords = player.getCoords(),
            z = parseInt(util.getStyle(player.container, zIndex), 10);

        this.traverseItems(function(obj)
        {
            if (obj.collidesWith(playerBounds))
            {
                //util.setStyle(obj.container, 'outline', '1px solid red');
                var layerPoint = obj.layerPoint,
                    objZ = parseInt(util.getStyle(obj.container, zIndex), 10);
                
                if (obj.debugTile) {
                    util.setStyles(obj.debugTile, {
                        outline: '1px solid red',
                        // bounds
                        // left: util.get(obj.bounds, '0', 0) + 'px',
                        // top: util.get(obj.bounds, '1', 0) + 'px',
                        // width: obj.getWidth(),
                        // height: obj.getHeight()
                        // layer point
                        left: util.get(obj, 'opts.layerPoint.0', 0) + 'px',
                        top: util.get(obj, 'opts.layerPoint.1', 0) + 'px',
                        width: 1,
                        height: 1
                    });
                }
                
                if (playerCoords[0] >= layerPoint[0] && playerCoords[1] >= layerPoint[1]) {
                    if (objZ > z) {
                        z = objZ + 1;
                    }
                } else if (objZ < z) {
                    z = objZ - 1;
                }
            } else {
                //util.setStyle(obj.container, 'outlineWidth', '0px');
            }
        });

        return z;
    },
    
    save: function()
    {
        var self = this,
            player = resources.player,
            items = {};
        
        self.traverseItems(function(item)
        {
            item.serialize();
            items[item.name] = item.attrs;
        });
        
        player.serialize();
        items.player = player.attrs;
        
        localStorage.saveGame = JSON.stringify(items);
        console.log(items);
    },
    
    load: function()
    {
        var self = this,
            saved = localStorage.saveGame;
        
        if (saved) {
            resources.saved = JSON.parse(saved || '{}');
            console.log(resources.saved);
            
            // clear inventory
            self.getInventory().clear();
            
            // set player location and any attrs
            player.unserialize(resources.saved.player);
            
            // set all items to saved state
            self.traverseItems(function(item) {
                item.unserialize(resources.saved[item.name] || {});
            });
        }
    }
};

}());
