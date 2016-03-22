// Copyright (c) 2016 Gamaiel Zavala. All rights reserved. Copyrights licensed under the MIT License.
// See the accompanying LICENSE file for terms.

SimpleUtil.listen(window, 'load', function()
{
    var util = SimpleUtil,
        //game, inventory, player, cursor,
        root = 'assets/img/';
    
    // init game
    game = new Adventure({width: 480, height: 272});
    
    // create player, inventory, cursor
    player = game.createPlayer(root + 'gob.png', {width:24, height:32, coords:[144, 70]});
    inventory = game.createInventory();
    cursor = game.createCursor(root + 'cursor.png', {width: 35, height: 28, offsets:[[1,4],[15,24],[12,12],[12,8],[20,24]]});
    
    game.registerRoom('oldfire', TheOldManAndTheFire, {background: root + 'bg.png', map: level1});
    game.loadRoom('oldfire');
});
