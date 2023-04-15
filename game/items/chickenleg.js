(function(){

var util = SimpleUtil;

GameChickenLeg = function(path, opts, cb)
{
    var self = this;

    opts = util.merge(opts || {}, {
      width: 25, height: 12, coords: [214, 119], walkTo: [-30, 70], layerPoint: [0, 50], zIndex: 80,
      pocketable: true, title: "chicken leg",
      description: "A juicy chicken leg."
    });

    // use call since opts has been modified
    GameChickenLeg.parent.constructor.apply(self, arguments);
};

util.extend(GameChickenLeg, AdventureItem,
{
    onUse: function(e)
    {
        var chickenleg = this,
            player = chickenleg.getPlayer(),
            inventory = chickenleg.getInventory(),
            target = e.target;

        switch (target.name) {
            case "petals":
                if (chickenleg.isNot("petaled")) {
                    player.say("I added some petals to the chicken leg. Mmm, herbed chicken.");
                    chickenleg.set("petaled");
                    chickenleg.setFrame(3);
                    chickenleg.setTitle("herbed chicken leg");
                    chickenleg.setDesc("A juicy herbed chicken leg.");
                    chickenleg.setActive();
                    target.destroy();
                }
            break;
            default: return true;
        }
    }
});

}());
