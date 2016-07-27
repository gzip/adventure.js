(function(){

var util = SimpleUtil,
    root = 'assets/img/';

Sewer = function()
{
    Sewer.parent.constructor.apply(this, arguments);
}

util.extend(Sewer, AdventureRoom,
{
    init : function(game)
    {
        // ITEM: bottle
        //bottle = game.createItem(root + 'bottle.png', {itemClass: GameBottle});
    },
    
    load : function(err, game)
    {
        var self = this;
        Sewer.parent.load.call(self, err, game, function initItems(err)
        {
        });
    }
});

}());
