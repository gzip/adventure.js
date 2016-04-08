(function(){

var util = SimpleUtil;

GameDog = function(path, opts, cb)
{
    var self = this;
    
    opts = util.merge(opts || {}, {
        coords: [320, 92],
        walkTo: [40, 60],
        description: [
            'It\'s a big scary dog.',
            'He gives me the chills just looking at him.',
            'How am I gonna get around him?'
        ]
    });
    
    GameDog.parent.constructor.call(self, path, opts, cb);
};

util.extend(GameDog, AdventureItem,
{
    onPickUp: function()
    {
        var self = this,
            player = self.getPlayer();
        
        player.say(self.cycleDialog([
            'I don\'t want to touch that hairy mongrel!',
            'He probably has fleas!',
            'I\'m not touching the damn dog!'
        ], 'pickup', false));
    },
    
    onUse: function(e)
    {
        var self = this,
            player = self.getPlayer(),
            target = e.target;
        
        switch (target.name) {
            case 'chickenleg':
                if (target.is("petaled")) {
                    player.say('I don\'t want to get too close. He\'ll probably bite my hand off.');
                } else {
                    player.say('I think it\'s missing something.');
                }
            break;
            case 'bone':
                player.say('No way! My bone.');
            break;
            default: return true;
        }
    },
    
    onTalkTo: function()
    {
        var self = this;
        
        self.say(self.cycleDialog([
            'Woof!',
            'Arf!',
            'Le Chick!'
        ], 'talkto'));
    }
});

}());
