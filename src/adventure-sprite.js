// Copyright (c) 2016 Gamaiel Zavala. All rights reserved. Copyrights licensed under the MIT License.
// See the accompanying LICENSE file for terms.

(function(){

var util = SimpleUtil;

AdventureSprite = function (path, opts, cb)
{
    var self = this;
    opts ? null : opts = {};
    
    AdventureSprite.parent.constructor.apply(self, [path, opts, function(err, asset)
    {
        var assetDims = asset.assetDims,
            assetWidth = assetDims[0],
            assetHeight = assetDims[1];
        
        self.width = opts.width || assetWidth;
        self.height = opts.height || assetHeight;
        util.setStyles(self.container, {width: self.width + 'px', height: self.height + 'px'});
        
        self._sprite = {
            cols: parseInt(assetWidth / self.width, 10),
            rows: parseInt(assetHeight / self.height, 10),
            currentFrame: 1,
            startFrame: 1,
            endFrame: 1,
            maxFrame: 1,
            interval: opts.fps ? Math.round(1000/opts.fps) : 60,
            startx: 0, starty: 0, endx: 0, endy: 0,
            offsetx: 0, offsety: 0, lastPos: '',
            flipv: false, fliph: false, reverse: false, playing: false
        };
        
        self._sprite.maxFrame = self._sprite.rows * self._sprite.cols;
        self._sprite.endFrame = self._sprite.maxFrame;

        // set up functions for request animation frame
        var _scopedAnimate = util.bind(self.animate, self);
        self._sprite._animate = function () {
            util.onFrame(_scopedAnimate);
        };
        
        if (opts.frame && opts.frame !== 1) {
            self.setFrame(parseInt(opts.frame, 10));
        }
        
        if (opts.frameBounds) {
            self.setFrameBounds(opts.frameBounds[0], opts.frameBounds[1]);
        }

        if (opts.playing) {
            self.play();
        }
        
        if (util.isFunc(cb)) {
            cb(err, self);
        }
    }]);
};

util.extend(AdventureSprite, AdventureAsset,
{
    _sprite: {},
    width: 0,
    height: 0,
    
    animate: function()
    {
        var self = this,
            _sprite = self._sprite,
            assetWidth = self.assetDims[0];
        
        if(_sprite.playing){
            if(_sprite.reverse){
                _sprite.offsetx -= self.width;
                if(_sprite.offsetx < 0){
                    _sprite.offsetx = self.width * (_sprite.cols-1);
                    _sprite.offsety -= self.height;
                }
                if(_sprite.offsety < _sprite.starty ||
                    (_sprite.offsety == _sprite.starty && _sprite.offsetx < _sprite.startx)){
                    _sprite.offsetx = _sprite.endx;
                    _sprite.offsety = _sprite.endy;
                }
            } else {
                _sprite.offsetx += self.width;
                if(_sprite.offsetx >= assetWidth){
                    _sprite.offsetx = 0;
                    _sprite.offsety += self.height;
                }
                if(_sprite.offsety > _sprite.endy ||
                    (_sprite.offsety == _sprite.endy && _sprite.offsetx > _sprite.endx)){
                    _sprite.offsetx = _sprite.startx;
                    _sprite.offsety = _sprite.starty;
                }
            }

            _sprite.currentFrame = (_sprite.offsetx ? _sprite.offsetx/self.width + 1 : 1) +
                (_sprite.offsety ? assetWidth/self.width * _sprite.offsety/self.height : 0);
        }
        
        self.draw();
    },
    
    draw: function()
    {
        var self = this,
            _sprite = self._sprite,
            pos = '-' + _sprite.offsetx + 'px -' + _sprite.offsety + 'px';
        
        if (pos != _sprite.lastPos) {
            util.setStyle(self.container, 'backgroundPosition', pos);
            _sprite.lastPos = pos;
        }
    },
    
    setFrameBounds: function(start, end)
    {
        var self = this,
            _sprite = self._sprite;
        
        if(start > end || end > _sprite.maxFrame) return 0;
        _sprite.startFrame = start;
        _sprite.endFrame = end;
        
        self.setFrameOffsets(start, 'start');
        self.setFrameOffsets(end, 'end');
        
        if(_sprite.currentFrame > end || _sprite.currentFrame < start)
        {
            _sprite.offsetx = _sprite.startx;
            _sprite.offsety = _sprite.starty;
            _sprite.currentFrame = start;
        }
        
        return _sprite.currentFrame;
    },
    
    setFrameOffsets: function(frame, type)
    {
        var self = this,
            _sprite = self._sprite,
            col = frame % _sprite.cols,
            row = Math.floor(frame / _sprite.cols);
        
        if(col === 0){ col = _sprite.cols; }
        _sprite[type+'x'] = (col-1) * self.width;
        
        if(frame % _sprite.cols === 0){ row--; }
        _sprite[type+'y'] = row * self.height;
        
        return frame;
    },
    
    setFrame: function(frame)
    {
        var self = this;
        self.setFrameOffsets(frame, 'offset');
        self._sprite.currentFrame = frame;
        self.draw();
        return frame;
    },
    
    getFrame: function()
    {
        return this._sprite.currentFrame;
    },
    
    nextFrame: function()
    {
        var self = this,
            _sprite = self._sprite,
            next = _sprite.currentFrame + 1 <= _sprite.endFrame ? _sprite.currentFrame + 1 : _sprite.startFrame;
        
        return self.setFrame(next);
    },
    
    previousFrame: function()
    {
        var self = this,
            _sprite = self._sprite,
            prev = _sprite.currentFrame - 1 >= _sprite.startFrame ? _sprite.currentFrame - 1 : _sprite.endFrame;
        
        return self.setFrame(prev);
    },
    
    stop: function()
    {
        var self = this,
            _sprite = self._sprite;
        if (_sprite.timer) {
            clearInterval(_sprite.timer);
            _sprite.timer = null;
        }
        _sprite.playing = 0;
    },
    
    play: function()
    {
        var self = this,
            _sprite = self._sprite;
        if (!_sprite.timer) {
            // TODO: implement requestAnimationFrame instead
            _sprite.timer = setInterval(_sprite._animate, _sprite.interval);
        }
        _sprite.playing = 1;
    },
    
    isPlaying: function()
    {
        return !!this._sprite.playing;
    },
    
    getWidth: function()
    {
        var self = this,
            bounds = self.bounds;
        return bounds ? bounds[2] - bounds[0] : self.width;
    },
    
    getHeight: function()
    {
        var self = this,
            bounds = self.bounds;
        return bounds ? bounds[3] - bounds[1] : self.height;
    },
    
    serialize: function()
    {
        var self = this,
            frame = self.getFrame();
        
        if (frame !== 1) {
            self.set("frame", frame);
        }
    }
});
}());
