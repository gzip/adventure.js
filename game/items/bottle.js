(function(){

var util = SimpleUtil;

GameBottle = function(path, opts, cb)
{
    var self = this;
    
    opts = util.merge(opts || {}, {
      width: 11, coords: [214, 119], walkTo: [-30, 70], layerPoint: [0, 50], zIndex: 100,
      pocketable: true, title: "bottle of wine",
      description: ["It's a bottle of wine.", "Two buck chuck?;; Probably more like Thunderbird."]
    });
    
    // use call since opts has been modified
    GameBottle.parent.constructor.apply(self, arguments);
};

util.extend(GameBottle, AdventureItem,
{
    onPickUp: function()
    {
        var bottle = this,
            player = bottle.getPlayer();
        
        if (bottle.is("fallen")) {
            if (player.isAt(bottle)) {
                setTimeout(function()
                {
                    bottle.setStyles({
                        transitionDuration: "0s",
                        transform: ""
                    }, true);
                }, 1);
                bottle.unset("fallen");
            }
            return true;
        } else if (bottle.isNot("pocketed")) {
            player.walkTo(bottle, function walkToBottle()
            {
                player.say("I can't reach it.");
            });
        } else {
            return true;
        }
    },
    
    onBeforeUse: function(e)
    {
        var bottle = this,
            player = bottle.getPlayer(),
            target = e.target;
        
        switch (target.name) {
            case "man":
                if (target.is("asleep")) {
                    player.say("I better not bother him.");
                    return false;
                }
                else if (bottle.isNot("full") || bottle.isNot("petaled"))
                {
                    player.say("I feel like it's missing something.");
                    return false;
                }
            break;
        }
    },
    
    onUse: function(e)
    {
        var bottle = this,
            player = bottle.getPlayer(),
            target = e.target;
        
        switch (target.name) {
            case "petals":
                if (player.has("bottle")) {
                    if (bottle.isNot("petaled")) {
                        player.say("I put some petals in the bottle. It did need a little competitive edge.");
                        bottle.set("petaled");
                    } else {
                        player.say("There are already some petals in there. They add a dreamy aroma.");
                    }
                } else {
                    player.say("I can't reach it.");
                }
            break;
            case "flower":
                if (bottle.is("full")) {
                    player.say("That's a nice thought.");
                    player.walkTo(flower, function walkToFlower()
                    {
                        bottle.empty();
                        player.say("There, have some water.");
                    });
                } else {
                    return true;
                }
            break;
            case 'bone':
                player.say("Unfortunately, it doesn't fit.");
            break;
            default: return true;
        }
    },
    
    onTalkTo: function()
    {
        var player = this.getPlayer();
        player.say("Do I look drunk?");
    },
    
    onFall: function()
    {
        var bottle = this;
        bottle.setStyles({
            position: 'absolute',
            transitionProperty: 'top, left, ' + util.resolvePrefix('transform'),
            transitionTimingFunction: 'ease-in, ease-out, ease-out',
            transitionDuration: '.2s',
            transform: 'rotate(-90deg)'
        }, true);
        //
        bottle.setXY(-35, 70, true);
        bottle.set("fallen");
        // TODO move to attr to accommodate save
        bottle.opts.walkTo = [-20, 30];
        bottle.empty();
        setTimeout(function() { bottle.setFrame(2); }, 200);
        bottle.setDesc(["It's an empty bottle of wine.", "It fell when I slammed into the well."]);
    },
    
    setPocketed: function()
    {
        var bottle = this;
        bottle.setDesc(function bottleDesc()
        {
            var hasPetals = bottle.is("petaled"),
                hasWater = bottle.is("full"),
                desc;

            if (hasPetals || hasWater) {
                desc = "The bottle has " +
                    (hasWater ? "water" : "") +
                    (hasWater && hasPetals ? " and " : "") +
                    (hasPetals ? "petals" : "") + " in it";
            } else {
                desc = "It's an empty bottle";
            }

            return desc + " but it still smells like wine.";
        });
        return GameBottle.parent.setPocketed.apply(bottle, arguments);
    },
    
    setFull: function()
    {
        var bottle = this,
            player = bottle.getPlayer();

        bottle.setTitle("bottle of water");
        bottle.setFrame(3);

        return true;
    },

    empty: function()
    {
        var bottle = this;

        bottle.unset('full');
        bottle.unset("petaled");
        bottle.setTitle("empty bottle");
        bottle.setFrame(2);

        return true;
    }
});

}());
