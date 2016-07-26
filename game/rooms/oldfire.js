(function(){

var util = SimpleUtil,
    root = 'assets/img/';

TheOldManAndTheFire = function()
{
    TheOldManAndTheFire.parent.constructor.apply(this, arguments);
}

util.extend(TheOldManAndTheFire, AdventureRoom,
{
    init : function(game)
    {
        // pocketable items must be created in init
        //var bottle, bone, chickenLeg, petals;
        
        // ITEM: bottle
        bottle = game.createItem(root + 'bottle.png', {itemClass: GameBottle});
        
        // ITEM: chicken leg
        chickenLeg = game.createItem(root + 'chickenleg.png', {itemClass: GameChickenLeg, render: false});
    
        // ITEM: bone
        bone = game.createItem(root + 'chickenleg.png', {
            width: 25, frame: 2, coords: [330, 141], walkTo: [-10, 10],
            //layerPoint: [-10, 10],
            name: 'bone', title: 'bone', pocketable: true, debug: true,
            description: [
                "It's the chicken bone that the dog spit out."
            ],
            render: false
        });
        
        // ITEM: petals
        petals = game.createItem(root + 'flower.png', {
            width: 16, height: 20, name: 'petals',
            description: ['Some sleepy willow petals.', 'They even <em>look</em> drowsy.'],
            render: false
        });
    },
    
    load : function(err, game)
    {
        var self = this;
        TheOldManAndTheFire.parent.load.call(self, err, game, function initItems(err)
        {
            //var well, dog, bowl, flower, fire, man, bucket, rock, chicken, flower;
            // items must be created from top to bottom so layering is correct w/ multiple collisions
            // TODO: order automatically based on y
            
            // ITEM: flower
            flower = game.createItem(root + 'flower.png', {
                coords:[150, 50], layerPoint:[0, 40], walkTo:[19, 48], pocketable: true,
                description: ['It\'s a sleepy willow.']
            });
            flower.on('pickup', function()
            {
                if (player.has('petals')) {
                    player.say('I already have some petals.');
                } else {
                    player.walkTo(flower, function()
                    {
                        // TODO flower.setDeflowered
                        inventory.add(petals);
                        player.say('I picked some petals from the sleepy willow.');
                    });
                }
            });
            flower.on('talkto', function(e)
            {
                player.say("Nah. I don't want to disturb them.;; :flower: Zzz...");
            });
            
            // ITEM: dog
            dog = game.createItem(root + 'dog.png', {itemClass: GameDog});
            
            // ITEM: bowl
            bowl = game.createItem(root + 'dogbowl.png', {width: 27, coords:[386, 131], walkTo: [45, 25], layerPoint: [-10, 18],
                title: 'dog bowl',
                description: [
                    "It's empty.",
                    "The dog's name is Fido,;; how original."
                ]
            });
            bowl.on('use', function(e)
            {
                var target = e.target;
                switch (target.name) {
                    case 'chickenleg':
                        if (target.is("petaled")) {
                            player.walkTo(bowl, function()
                            {
                                bowl.set("full");
                                player.say('Sweet dreams flea bag.');
                                
                                setTimeout(function()
                                {
                                    game.add(bone);
                                    bowl.unset("full");
                                    player.say('He ate the chicken, spit out the bone, and passed out. W00t!');
                                }, 1500);
                            });
                        }
                        else
                        {
                            player.say('I think it\'s missing something.');
                        }
                    break;
                    default: player.say('He won\'t eat that.');
                }
            });
            bowl.setFull = function()
            {
                bowl.setFrame(2);
                inventory.remove('chickenleg');
                bowl.setDesc('It has an herbed chicken leg in it.');
                return true;
            };
            bowl.unsetFull = function()
            {
                bowl.setFrame(1);
                bowl.unset('description');
            };
            
            // ITEM: man
            man = game.createItem(root + 'man.png', {
                width: 85, coords:[-4, 42], bounds:[14, 22, 75, 95], layerPoint:[5, 95], walkTo: [95, 75],
                title: 'ugly old man', debug:true,
                description: [
                    "That's one ugly old man!",
                    "I wonder if he'll give me some chicken.",
                    "He gives me the willies just looking at him.",
                    "You think that mutt over there is his?"
                ]
            });
            man.on('kick', function()
            {
                man.setFrame(2);
                player.setDuration(3);
                player.setStyles({'transform': 'rotate(30deg)'}, true);
                player.setXY(190, 165);
                setTimeout(function()
                {
                    player.setDuration();
                    player.setStyles({'transform': ''}, true);
                    player.say('Ouch, that friggin\' hurt.');
                    player.set('offended');
                    man.setFrame(1);
                    setTimeout(function() { bottle.fire('fall'); }, 100);
                }, 300);
            });
            man.on('use', function(e)
            {
                switch (e.target.name) {
                    case 'bottle':
                        if (man.isNot("asleep")) {
                            player.walkTo(man, function()
                            {
                                man.setFrame(3);
                                setTimeout(function()
                                {
                                    player.say('He took the bottle and fell asleep.;; Sucker.');
                                    bottle.empty();
                                    man.set("asleep");
                                }, 2000);
                            });
                        } else {
                            player.say('Heh, he\'s had plenty to drink.');
                        }
                    break;
                    case 'petals':
                        player.say(man.cycleDialog(['Hmm.', 'He won\'t take them as-is.', 'I think I need to make them more enticing.']));
                    break;
                    default: return true;
                }
            });
            man.on('pickup', function()
            {
                player.say(man.cycleDialog([
                    'Hmm, if I picked up on him,;; would that make him a man-cougar,;; or me a confused barracuda?;; Either way,...;; no thanks.',
                    'I thought we already covered this.',
                    'Do I look like an ant that can lift 10x my weight in old man bones?',
                    '...'
                ], 'pickup'));
            });
            man.on('talkto', function()
            {
                if (man.is("asleep")) {
                    player.say("Let sleeping dogs lay.");
                }
                else if (player.is("offended")) {
                    player.say("So he can kick me again?! No thanks.");
                }
                else player.walkTo(man, function()
                {
                    player.say(man.cycleDialog([
                        'Excuse me kind sir, may I have a nibble of your chicken?;;\
                            :man: I\'ll kick in yer teeth if you so much as sniff at my bird! Go \'head, try it.',
                        'Will your pooch at least get a taste?;;\
                            :man: That good fer nuthin\' mutt\'ll be lucky not to get a foot in his dawgballz&trade;.',
                        '...',
                        'What\'s the point? He\'s a total prick.'
                    ], 'pickup', false));
                });
            });
            man.setAsleep = function(sleep)
            {
                // TODO man.set('description', ...)
                man.setDesc('Sleeping like a baby.');
                man.setFrame(4);
                return true;
            };
            
            // ITEM: well
            well = game.createItem(root + 'well.png', {coords:[209, 133], bounds:[0, 0, 117, 90], walkTo:[55, 100], layerPoint:[0, 75],
                description: [
                    'Well, well, well, what do we have here?',
                    "Well if you already don't know&hellip; ;; I can't tell you.",
                    'I like my adventure games done well&hellip; ;; and my dialog corny.',
                    'This well is too tall and that bird is too cooked&hellip; ;; (I prefer medium well.)']
            });
            well.on('pickup', function(e)
            {
                player.say('I never did well picking the right answer.');
            });
            well.on('talkto', function(e)
            {
                //player.say('I wish&hellip; ;; I wish&hellip;&hellip; ;; I wish I could get out of here.');
                player.say('Hello.;; :well: <small>Hello.</small>;; :well: <small><small>Hello.</small></small>;; :player: I think that was an echo.');
            });
            
            game.add(bottle);
            
            // ITEM: fire
            fire = game.createItem(root + 'fire.png', {width:78, bounds:[9, 24, 70, 60], coords:[70, 122], walkTo: [25, 65],
                frameBounds: [1, 2], layerPoint:[5, 60], fps: 4, playing: true, description: ['It\'s a raging hot fire.'], debug:true
            });
            fire.on('pickup', function()
            {
                player.say('Hmmm, yeah. Why don\'t I just dive in head first...');
            });
            fire.on('use', function(e)
            {
                switch (e.target.name) {
                    case 'bottle':
                        if (man.is("asleep")) {
                            if (bottle.is("full")) {
                                if (fire.is("out")) {
                                    player.say('The fire is already out.');
                                } else {
                                    player.walkTo(fire, function()
                                    {
                                        player.say('This should cool things down.');
                                        bottle.empty();
                                        fire.set('desc', 'The fire is out now.');
                                        fire.set("out");
                                    });
                                }
                            } else {
                                player.say('The bottle is empty.');
                            }
                        } else {
                            player.say('I don\'t want to get too close.');
                        }
                    break;
                    case 'petals':
                        player.say('They\'ll just burn up.');
                    break;
                    default: return true;
                }
            });
            fire.on('talkto', function(e)
            {
                player.say('Yeah I might be small,;; but don\'t mistake this for the shire.;;\
                    Man I thought you knew,;; I be spittin\' hot fire.;; ...;;\
                    It doesn\'t rap back;; it just crackles.');
            });
            // TODO fire.on("out")?
            fire.setOut = function()
            {
                if (chicken) {
                    chicken.stop();
                    chicken.setFrame(2);
                }
                fire.stop();
                fire.setFrame(3);
                return true;
            };
            
            // ITEM: chicken
            chicken = game.createItem(root + 'chicken.png', {width:40, coords:[100, 163], pocketable: true,
                layerPoint:[100, 100], walkTo:[-5, 20], frameBounds:[1,4], playing:true, fps:2,
                description: ['Finger lickin\' good.', 'Mmmm, plump breasts and thighs.',
                    'Poor old bird.', 'Hope I didn\'t know her.', 'I bet that mangey dog is dying for some.']
            });
            chicken.set("pickupCount", 0);
            chicken.on('pickup', function()
            {
                // TODO inc[rement]/dec[rement]
                switch(++chicken.attrs.pickupCount)
                {
                    case 1:
                        player.say('I dunno, that old guy looks mean.');
                    break;
                    case 2:
                        player.say('You sure?');
                    break;
                    case 3:
                        player.say('Alright, if you say so.');
                        player.walkTo(chicken, {target: man, action: 'kick'});
                    break;
                    default:
                        if (man.is("asleep")) {
                            if (fire.is("out")) {
                                if (player.has("chickenleg")) {
                                    player.say("I already have a chicken leg.");
                                }
                                else if (chicken.isNot("hobbled")) {
                                    chicken.set("hobbled");
                                }
                                else {
                                    player.say("One piece was enough.");
                                }
                            } else {
                                player.say("I won't get punted now but that fire is too hot!");
                            }
                        } else if (player.is("offended")) {
                            player.say("Seriously? Dude just punted me across the yard. WTF.");
                        }
                    break;
                }
            });
            chicken.on('use', function(e)
            {
                switch (e.target.name) {
                    case 'petals':
                        if (player.has('chickenleg')) {
                            player.say('Maybe I should put it on the piece I already have.');
                        } else {
                            player.say('Maybe if I had a piece.');
                        }
                    break;
                    default: return true;
                }
            });
            chicken.setHobbled = function()
            {
                chicken.setFrame(5);
                chicken.stop();
                
                if (bowl.isNot("full") && !player.has('chickenleg')) {
                    inventory.add(chickenLeg);
                }
                return true;
            }
            
            // ITEM: bucket
            bucket = game.createItem(root + 'bucket.png', {coords:[331, 205], bounds:[0, 0, 32, 30], layerPoint:[0, 26], walkTo: [-5, 20], description: ['It\'s a bucket full of water. Cool.']
            });
            bucket.on('pickup', function()
            {
                player.say('I need something that holds water first.');
            });
            bucket.on('use', function(e)
            {
                switch (e.target.name) {
                    case 'bottle':
                        if (bottle.isNot("full")) {
                            player.walkTo(bucket, function()
                            {
                                bottle.set('full');
                                player.say("The bottle is full of water now.");
                            });
                        } else {
                            player.say('It\'s already full.');
                        }
                    break;
                    case 'petals':
                        player.say(bucket.cycleDialog([
                            'That would be too diluted.',
                            'It should be more concentrated than that.'],
                        'dilute'));
                    break;
                    default: return true;
                }
            });
            
            // ITEM: rock
            rock = game.createItem(root + 'rock.png', {coords:[296, 234], walkTo: [-10, 7],
                description: ['It\'s a rock.', '100% Grade-A rock.', 'Still a rock.'], pocketable: true});
            rock.on('use', function(e)
            {
                var target = e.target;
                switch (target.name) {
                    case 'bucket':
                        player.say('Nah, it would just be a rock in the bucket.');
                    break;
                    case 'bottle':
                        player.say('I don\'t want to break it.' +
                            (target.is('pocketed') ? '' : ';; There has to be another way to get it down.'));
                    break;
                    case 'chicken':
                        player.say('What would that make, a rockabirdy?.');
                    break;
                    case 'man':
                        var text = player.is('offended') ? 'Believe me, now I\'d love to.' : 'He hasn\'t done anything to me.';
                        player.say(text);
                    break;
                    case 'dog':
                        player.say('Here doggie doggie, fetch this... rock.;; He\'s not interested, go figure.');
                    break;
                    default: return true;
                }
            });
        });
    }
});

}());
