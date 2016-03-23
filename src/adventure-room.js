// Copyright (c) 2016 Gamaiel Zavala. All rights reserved. Copyrights licensed under the MIT License.
// See the accompanying LICENSE file for terms.

(function(){

var util = SimpleUtil;

AdventureRoom = function(path, opts)
{
    var self = this;
    
    self.opts = opts || {};
    self.map = self.opts.map || [];
    self.graph = new Graph(self.map);
    self.path = path;
    util.set(self.opts, 'attrs.className', 'adv-board');
};

AdventureRoom.prototype =
{
    asset: {},
    background: '',
    map: [],
    init : function(game) {},
    load : function(err, game, cb)
    {
        var self = this;
        self.asset = new AdventureAsset(self.path, self.opts, function(err, asset)
        {
            self.rows = util.get(self, 'map.length');
            self.cols = util.get(self, 'map.0.length');
            self.tileSize = asset.assetDims[0] / self.cols;
            
            util.setStyles(self.container, {
                overflow: 'hidden'
            });
            
            if (util.isFunc(cb)) {
                cb(err, self);
            }
        });
        self.container = self.asset.container;
    },
    
    coordsToTile : function(coords)
    {
        var self = this,
            size = self.tileSize,
            x = Math.floor(coords[0] / size),
            y = Math.floor(coords[1] / size),
            val = self.map[y] ? self.map[y][x] : null;
        
        if (self.asset.debugTile) {
            util.setStyles(self.asset.debugTile, {
                left: x*size+'px',
                top: y*size+'px',
                width: self.tileSize + 'px',
                height: self.tileSize + 'px',
                opacity: 1,
                background: val ? '#fff' : '#000'
            });
        }
        
        //console.log('coords', coords, 'x,y', [x, y], 'cols,rows', [self.cols, self.rows], val);
        
        return [x, y, val];
    },
    
    getPath: function(fromCoords, toCoords)
    {
        var self = this,
            graph = self.graph,
            nodes = graph.nodes,
            // y first
            from = nodes[fromCoords[1]] ? nodes[fromCoords[1]][fromCoords[0]] : null,
            to = nodes[toCoords[1]] ? nodes[toCoords[1]][toCoords[0]] : null,
            path = to && from ? astar.search(nodes, from, to, true) : null;
        
        return path;
    },
    
    coordsToPath: function(toCoords)
    {
        var self = this,
            player = self.getPlayer(),
            fromCoords = self.coordsToTile(player.getCoords()),
            path = self.getPath(fromCoords, self.coordsToTile(toCoords));
        
        return path;
    }
};

}());
