// Copyright (c) 2016 Gamaiel Zavala. All rights reserved. Copyrights licensed under the MIT License.
// See the accompanying LICENSE file for terms.

(function(){

var util = SimpleUtil,
    WALK_DIST  = 1,
    WALK_TIME  = 25,
    
    CHAR_START = 2,
    CHAR_END   = 6,
    CHAR_LR    = 1,
    CHAR_DOWN  = 2,
    CHAR_UP    = 3,
    
    // dir values based on arrow keycodes
    DIR_N = 38,
    DIR_S = 40,
    DIR_W = 37,
    DIR_E = 39,
    DIR_IDLE = 32; // space

AdventurePlayer = function (path, opts, cb)
{
    var self = this,
        keyFunc = function(e){ self.animateWalk(e); };
    
    opts ? null : opts = {};

    AdventurePlayer.parent.constructor.apply(self, arguments);
    
    util.setStyles(self.container, {
        transitionProperty: 'top, left',
        transitionTimingFunction: 'linear'
        //transformOrigin: '50% 100%'
    }, true);

    // must be called after self.container is set
    self.setDuration();
    
    //util.listen(window, 'keydown', keyFunc);
    //util.listen(window, 'keyup', keyFunc);
    
    util.listen(self.container, util.resolvePrefix('transitionend'), function(e)
    {
        var prop = e.propertyName,
            value;
        
        switch(prop)
        {
            case 'left':
            case 'top':
                self.walkPath();
        }
    });
    
    //setInterval(function(){ self.walk(); }, WALK_TIME);
}

util.extend(AdventurePlayer, AdventureItem,
{
    walkSpeed: 100,
    prevFrame: CHAR_DOWN,
    path: [],
    lastDir: null,
    lastZ: 0,
    objective: null,
    
    getPublicMethods: function()
    {
        return ['get', 'getCoords', 'getHeight', 'getWidth', 'getXY',
                'has', 'isAt', 'say', 'setObjective', 'setXY', 'walkTo', 'cycleDialog'];
    },
    
    animateWalk: function(e)
    {
        var self = this,
            dir = e.dir || e.keyCode,
            handled;
        
        if(dir === DIR_IDLE || e.type === 'keyup')
        {
            self.setFrame(self._sprite.cols*(self.prevFrame-1)+1);
            self.stop();
            self.lastDir = null;
        }
        else if(dir && dir !== self.lastDir)
        {
            if (self.lastDir == DIR_W || self.lastDir === null) {
                self.mirror(false);
            }
            
            switch(dir)
            {
                case DIR_N:
                    self.setFrameBounds((CHAR_UP-1)*self._sprite.cols+CHAR_START, (CHAR_UP-1)*self._sprite.cols+CHAR_END);
                    self.prevFrame = CHAR_UP;
                    handled = true;
                break;
                case DIR_S:
                    self.setFrameBounds((CHAR_DOWN-1)*self._sprite.cols+CHAR_START, (CHAR_DOWN-1)*self._sprite.cols+CHAR_END);
                    self.prevFrame = CHAR_DOWN;
                    handled = true;
                break;
                case DIR_W:
                    self.mirror();
                    self.setFrameBounds(CHAR_LR*CHAR_START, CHAR_LR*CHAR_END);
                    self.prevFrame = CHAR_LR;
                    handled = true;
                break;
                case DIR_E:
                    self.setFrameBounds(CHAR_LR*CHAR_START, CHAR_LR*CHAR_END);
                    self.prevFrame = CHAR_LR;
                    handled = true;
                break;
            }
            
            self.play();
            
            self.lastDir = handled ? dir : null;
        }
        
        if(self.lastDir && e.keyCode){
            util.processEvent(e, true);
        }
    },
    
    walkPath: function()
    {
        var self = this,
            path = self.path;

        if(path.length)
        {
            var node = path.shift(),
                size = self.getTileSize(),
                origin = self.getOrigin(),
                intVal = parseInt,
                // find center xy of tile
                // TODO: make sense out of transposed x/y
                x = intVal(node.y * size + size / 2 - origin[0]),
                y = intVal(node.x * size + size / 2 - origin[1]),
                curX = self.getX(),
                curY = self.getY(),
                isDiagnol = curX !== x && curY !== y,
                duration = isDiagnol ? 2.0 : 1.0,
                dir = self.coordsToDir([x, y]);
            
            //self.tileAt([x, y], true); // debug
            self.setDuration(duration);
            self.animateWalk({dir: dir});
            self.setXY(x, y);
        }
        else
        {
            var target = self.target;
            
            self.animateWalk({dir: DIR_IDLE});
            
            // face the target if present
            if (target) {
                self.face(target);
                self.target = null;
            }
            
            self.completeObjective();
        }
    },
    
    walkTo: function(coords, objective)
    {
        var self = this,
            path;
        
        if (coords instanceof AdventureItem) {
            self.target = coords;
            coords = self.target.getWalkTo();
        } else if (objective) {
            self.target = objective.target;
        }
        
        path = self.coordsToPath(coords);
        if (path && path.length) {
            self.setPath(path);
            self.setObjective(objective);
        // TODO verify player walked to target?
        } else {
            self.setObjective(objective);
            self.completeObjective();
        }
    },
    
    completeObjective: function()
    {
        var self = this,
            objective = self.objective || {};
        
        if (util.isFunc(objective)) {
            objective();
        } else if (objective.target) {
            objective.target.fire(objective.action);
        }
        
        // clear objective
        self.setObjective(null);
    },
    
    face: function(obj)
    {
        var self = this;
        self.animateWalk({dir: self.coordsToDir(obj)});
        self.animateWalk({dir: DIR_IDLE});
    },
    
    coordsToDir: function(obj)
    {
        var self = this, x, y,
            curX = self.getX(),
            curY = self.getY(),
            collides = true,
            coords,
            dir;
        
        if (obj instanceof AdventureItem) {
            coords = [obj.getX(), obj.getY()];
            collides = obj.collidesWith(self.getBounds());
        } else {
            coords = obj;
        }
        
        x = coords[0];
        y = coords[1];
        
        switch(true)
        {
            case curY > y && collides:
                dir = DIR_N; break;
            case curX > x:
                dir = DIR_W; break;
            case curX < x:
                dir = DIR_E; break;
            case curY < y:
                dir = DIR_S; break;
        }
        
        return dir;
    },
    
    setPath: function(path)
    {
        var self = this;
        self.path = path;
        self.setObjective(null);
        self.walkPath();
    },
    
    setObjective: function(objective)
    {
        var self = this;
        self.objective = objective;
    },
    
    isAt: function(asset)
    {
        var self = this,
            walkTo = asset.getWalkTo(),
            player = asset.getPlayer(),
            playerCoords = self.getCoords(),
            size = self.getTileSize(),
            abs = Math.abs;

        // check if the player is on point
        if (abs(playerCoords[0]-walkTo[0]) < size
         && abs(playerCoords[1]-walkTo[1]) < size) {
            return true;
        }

        return false;
    },
    
    setDuration: function(multiplier)
    {
        var self = this,
            duration = self.walkSpeed / 1000 * (multiplier||1) + 's';
        
        util.setStyle(self.container, 'transitionDuration', duration, true);
        
        return duration;
    },
    
    getCoords: function()
    {
        var self = this,
            origin = self.getOrigin(),
            x = self.getX() + origin[0],
            y = self.getY() + origin[1];
        
        return [x, y];
    },
    
    getOrigin: function()
    {
        var self = this,
            w = self.width,
            h = self.height,
            x = Math.round(w/2),
            y = h;
        
        return [x, y];
    },
    
    isWalkable: function(x, y, dir)
    {
        var self = this,
            h = self.height,
            w = self.width;
        
        return self.tileAt([x, y + h])[2];
    },
    
    isWalking: function()
    {
        return this.isPlaying();
    },
    
    setXY: function(x, y, rel)
    {
        var self = this;
        AdventurePlayer.parent.setXY.apply(self, arguments);
        self.setZ();
    },
    
    setZ: function()
    {
        var self = this;
        util.setStyle(self.container, 'zIndex', self.getMaxZ());
    },
    
    serialize: function()
    {
        var self = this;
        AdventurePlayer.parent.serialize.apply(self, arguments);
        // set attrs directly since `set` will end up calling setX
        // TODO setAttr?
        self.attrs.x = parseInt(self.getStyle('left'), 10);
        self.attrs.y = parseInt(self.getStyle('top'), 10);
    },
    
    /*
    walk: function()
    {
        var self = this,
            dir = self.lastDir,
            sprite = self,
            x = self.getX(),
            y = self.getY();
        
        if(!dir) return;
        
        switch(dir)
        {
            case DIR_N:
                if(self.isWalkable(x - WALK_DIST, y - WALK_DIST)) {
                    sprite.setY(-(WALK_DIST), true);
                }
            break;
            case DIR_S:
                if(self.isWalkable(x - WALK_DIST, y + WALK_DIST)) {
                    sprite.setY(WALK_DIST, true);
                }
            break;
            case DIR_W:
                if(self.isWalkable(x - WALK_DIST, y - WALK_DIST)) {
                    sprite.setX(-(WALK_DIST), true);
                }
            break;
            case DIR_E:
                if(self.isWalkable(x + WALK_DIST, y - WALK_DIST)) {
                    sprite.setX(WALK_DIST, true);
                }
            break;
        }
    },
    */
    
    // the following methods are augmented by Adventure
    
    say: function(msg)
    {
    },
    
    tileAt: function()
    {
    },
    
    getTileSize: function()
    {
    },
    
    getMaxZ: function()
    {
    }
});

}());
