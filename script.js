const GAME_ITEMS = {};
var STATE = null;

class Player {
    constructor(id, area) {
        this.id = id;
        this.engine_hand = new Hand(KIND_Engine, []);
        this.photo_hand  = new Hand(KIND_Photo, []);
        this.engine = new Engine();

        this.area = area;
    }
}
function get_current_player() {
    const sm = GAME_ITEMS['state-machine'];
    const player = GAME_ITEMS[sm.whose_turn];
    return player;
}


SINIT = 'init';
SPTURN = 'playerturn';
SPOWER = 'powerqueue';
SADTURN = 'adversaryturn';

class StateMachine {

    constructor() {
        this.state = SINIT;
        this.whose_turn = null;

        this.power_queue = null;
        this.power_idx = null;

        this.completed = {};
        for (const color of COLORS) { this.completed[color] = false; }
    }

    is_game_complete() {
        for (const color of COLORS) {
            if (!this.completed[color]) {
                return false;
            }
        }
        return true;
    }

    mark_complete(color) { this.completed[color] = true; }

    handle_init(numplayers) {
        set_text(`Press Enter to begin ${numplayers}-player game.`, true, () => {this.start_game(numplayers)}, 0);
    }

    start_game(numplayers) {
        for (var i = 1; i < numplayers+1; ++i) { new_player(i); }

        const photo_deck = PhotoCard.default_deck();
        photo_deck.shuffle();
        const cg = new ColorGrid(photo_deck);
        cg.refresh_dom();


        const engine_deck = EngineCard.default_deck();
        engine_deck.shuffle();

        const adversary_deck = AdversaryCard.default_deck();
        const adversary_discard = new Hand(KIND_Adversary, []);
        const stolen_cards = new Hand(KIND_Photo, []);

        GAME_ITEMS['photo-deck'] = photo_deck;
        GAME_ITEMS['engine-deck'] = engine_deck;
        GAME_ITEMS['adversary-deck'] = adversary_deck;
        GAME_ITEMS['adversary-discard'] = adversary_discard;
        GAME_ITEMS['stolen-cards'] = stolen_cards;

        GAME_ITEMS['color-grid'] = cg;
        GAME_ITEMS['engine-stock'] = [];
        GAME_ITEMS['num-players'] = numplayers;


        document.getElementById('engine-deck').replaceChildren(engine_deck.refresh_dom());
        document.getElementById('engine-stock').textContent = '<engine-stock>';
        document.getElementById('adversary-deck').replaceChildren(adversary_deck.refresh_dom());
        document.getElementById('adversary-discard').textContent = '<adversary-discard>';
        document.getElementById('adversary-discard').appendChild(adversary_discard.refresh_dom());
        document.getElementById('stolen-cards').textContent = '<stolen-cards>';
        document.getElementById('stolen-cards').appendChild(stolen_cards.refresh_dom());

        //const ecard = EngineCard.deser("<ablue,>agreen,^tblue,vtgreen,!");
        //document.body.appendChild(ecard.element());

        for (var i = 0; i < NUM_STOCK_CARDS; i += 1) { add_card_to_engine_stock(); }
        for (var i = 1; i < numplayers+1; ++i) {
            for (var j = 0; j < NUM_STARTING_CARDS; j += 1) {
                draw_engine_card_to_player_hand(i);
            }
        }
        this.start_player_turn(1)
    }

    start_player_turn(i) {
        this.state = SPTURN;
        this.whose_turn = i;
        const options = [
            ['Take one Engine Card from stock/deck', () => {StateMachine.handle_take_action();}],
            ['Play one Engine Card from hand', () => {StateMachine.handle_play_action();}],
            ['Flip one Photo Card in grid', () => {StateMachine.handle_flip_action();}],
            ['Activate Engine', () => {StateMachine.handle_activate_action();}],
            ['Complete a Set', () => {StateMachine.handle_complete_action();}],
        ];
        set_text_with_options(`Player ${i} turn. Select one: `, options);

        GAME_ITEMS[this.whose_turn].area.classList.add("current-turn");
        //document.getElementById(`player-area-${this.whose_turn}`).classList.add("current-turn");
    }

    start_next_player_turn(i) {
        // setup for next player
        GAME_ITEMS[this.whose_turn].area.classList.remove("current-turn");
        this.whose_turn += 1;
        if (this.whose_turn == GAME_ITEMS['num-players'] + 1) {
            this.whose_turn = 1;
        }

        this.start_player_turn(this.whose_turn);
    }

    static handle_activate_action() {
        const p = get_current_player();
        if (p.engine.count <= 0) {
            const sm = GAME_ITEMS['state-machine'];
            set_text(
                "Player has no cards in Engine. Select another option.",
                true,
                () => {sm.start_player_turn(sm.whose_turn);},
                0
            );
            return;
        }
        set_text("Select Engine Card to activate.", false, null, 1000);
        document.addEventListener("click", StateMachine.activate_input_handler_click);
        const area = document.querySelector(".player-area.current-turn");
        const engine = area.querySelector(".engine");
        engine.classList.add("ACTIVE");
    }

    static reset_after_activate_action() { 
        document.removeEventListener("click", StateMachine.activate_input_handler_click);
        const area = document.querySelector(".player-area.current-turn");
        const engine = area.querySelector(".engine");
        engine.classList.remove("ACTIVE");
    }

    static activate_input_handler_click(event) {
        const engine = event.target.closest(".engine.ACTIVE");
        if (!engine) {
            // we clicked something that wasn't the engine deck and isn't in the stock 
            return;
        }
        const card = event.target.closest(".engine-card");
        if (!card) {
            // we didn't click an engine card
            return;
        }

        //const c = Card.card_from_ele(card);
        StateMachine.reset_after_activate_action();

        StateMachine.handle_select_action_color_subaction(card);
    }

    static handle_select_action_color_subaction(card) {
        console.log('card', card);
        const p = get_current_player();
        const options = [];
        for (const color of COLORS) {
            options.push([color, () => {StateMachine.activate_engine_card_with_color(card, color)}]);
        }
        card.classList.add("selected");
        set_text_with_options(`Select activation color: `, options);
    }

    static reset_after_select_action_color_subaction(card) {
        console.log("remove selected from card", card);
        card.classList.remove("selected");
    }

    static activate_engine_card_with_color(card, color) {
        const c = Card.card_from_ele(card);
        console.log(c, c.arrow_left);
        if (c.arrow_left.color !== color &&
            c.arrow_right.color !== color &&
            c.arrow_up.color !== color &&
            c.arrow_down.color !== color
        ) {
            set_text(`Card has no ${color} arrows.`, true, () => {StateMachine.handle_select_action_color_subaction(card)}, 0);
            return;
        }


        const queue = StateMachine.activate(c, color);
        StateMachine.reset_after_select_action_color_subaction(card)

        StateMachine.do_power_queue(queue);


        //const sm = GAME_ITEMS['state-machine'];
        //sm.start_adversary_turn();
    }

    static do_power_queue(queue) {
        const sm = GAME_ITEMS['state-machine'];
        sm.state = SPOWER;

        sm.power_queue = queue;
        sm.power_idx = 0;
        console.log("Queue:", sm.power_queue.length);

        sm.dispatch_power_queue();
    }

    dispatch_power_queue() {
        console.log("dispatch", this.power_idx, this.power_queue);
        if (this.power_queue.length > this.power_idx) {
            const card = this.power_queue[this.power_idx];
            this.power_idx += 1;
            StateMachine.do_card_power(card);
        }
        else {
            this.power_queue = null;
            this.power_idx = null;
            console.log("power queue done.");
            const sm = GAME_ITEMS['state-machine'];
            sm.start_adversary_turn();
        }

    }

    static handle_complete_action() {
        const options = [];
        for (const color of COLORS) {
            options.push([color, () => {StateMachine.check_complete(color)}]);
        }
        set_text_with_options(`Select color to complete: `, options);
    }

    static check_complete(color) {
        const p = get_current_player();
        const sm = GAME_ITEMS['state-machine'];
        var count = 0;
        for (const card of p.photo_hand.cards) {
            if (card.color === color) { count += 1; }
        }
        if (count < COLOR_SET_SIZE) {
            set_text(
                `Player has ${count} ${color} cards. Requires ${COLOR_SET_SIZE}.`,
                true,
                () => {sm.start_player_turn(sm.whose_turn);},
                0
            );
        }
        else {
            count = 0;
            // copy because we're going to mutate
            const cards = [...p.photo_hand.cards];
            for (const card of cards) {
                if (card.color === color) {
                    p.photo_hand.remove(card); 
                }
            }
            sm.mark_complete(color);
            set_text(
                `Completed ${color} set.`,
                true,
                () => {
                    if (sm.is_game_complete()) {
                        set_text("Players win!!", true, null, 0);
                    }
                    else {
                        sm.start_adversary_turn();
                    }
                },
                0
            );
        }
    }


    static handle_flip_action() {
        set_text("Select Photo Card to flip", false, null, 1000);
        document.addEventListener("click", StateMachine.flip_input_handler_click);
        document.getElementById("color-grid").classList.add("ACTIVE");
    }
    static reset_after_flip_action() { 
        document.removeEventListener("click", StateMachine.flip_input_handler_click);
        document.getElementById("color-grid").classList.remove("ACTIVE");

    }

    static flip_input_handler_click(event) {
        const cg = event.target.closest("#color-grid");
        if (!cg) {
            console.log("click not in color grid");
            return;
        }

        const cardele = event.target.closest(".photo-card");
        console.log(cardele);
        if (cardele) {
            const c = Card.card_from_ele(cardele);
            // XXX logic for Placeholder cards??
            /*
            if (c.face_up === true) { 
                console.log("Already face up.");
                return;
            }
            */
            //c.flip_up();
            c.flip();

            const sm = GAME_ITEMS['state-machine'];
            StateMachine.reset_after_flip_action();
            sm.start_adversary_turn();
        }
    }

    static handle_take_action() {
        set_text("Select an Engine Card from the stock or draw one from the Engine Deck", false, null, 0);
        document.addEventListener("click", StateMachine.take_engine_card_handler_click);
        document.getElementById("engine-stock").classList.add("ACTIVE");
        document.getElementById("engine-deck").classList.add("ACTIVE");
    }

    static reset_after_take_action() {
        document.removeEventListener("click", StateMachine.take_engine_card_handler_click);
        document.getElementById("engine-stock").classList.remove("ACTIVE");
        document.getElementById("engine-deck").classList.remove("ACTIVE");

    }

    static take_engine_card_handler_click(event) {
        const sm = GAME_ITEMS['state-machine'];
        var complete = false;

        const deck = event.target.closest("#engine-deck");
        if (deck) {
            console.log("DRAW");
            draw_engine_card_to_player_hand(sm.whose_turn);
            complete = true;
        }
        else {
            const stock = event.target.closest("#engine-stock");
            if (!stock) {
                // we clicked something that wasn't the engine deck and isn't in the stock 
                return;
            }
            const card = event.target.closest(".engine-card");
            if (!card) {
                // we didn't click an engine card
                return;
            }
            const c = Card.card_from_ele(card);
            remove_card_from_engine_stock(c);

            const player = GAME_ITEMS[sm.whose_turn];
            player.engine_hand.add(c);
            complete = true;
        }

        if (complete) {
            StateMachine.reset_after_take_action();
            sm.start_adversary_turn();
        }
    }

    static handle_play_action() {
        const sm = GAME_ITEMS['state-machine'];
        const p = get_current_player();
        if (p.engine_hand.cards.length == 0) {
            set_text(
                "Player has no engine cards to play. Select another option.",
                true,
                () => {sm.start_player_turn(sm.whose_turn);},
                0
            );
            return;
        }
        set_text("Select Engine Card to play.", false, null, 1000);
        document.addEventListener("click", StateMachine.play_engine_card_handler_click);
        p.area.querySelector(".engine-hand").classList.add("ACTIVE");
    }

    static reset_after_play_action() {
        const p = get_current_player();
        document.removeEventListener("click", StateMachine.play_engine_card_handler_click);
        p.area.querySelector(".engine-hand").classList.remove("ACTIVE");
    }

    static play_engine_card_handler_click(event) {
        const sm = GAME_ITEMS['state-machine'];
        const player = GAME_ITEMS[sm.whose_turn];
        const hand = event.target.closest(".engine-hand");
        if (!hand) {
            // we clicked something that wasn't the engine deck and isn't in the stock 
            return;
        }
        const card = event.target.closest(".engine-card");
        if (!card) {
            // we didn't click an engine card
            return;
        }

        const c = Card.card_from_ele(card);
        card.classList.add("selected");

        // don't remove card from hand just yet so that player can still see it.

        // not actually complete. just move on to next subaction
        StateMachine.reset_after_play_action();
        StateMachine.handle_place_in_engine_subaction(c);
    }

    static handle_place_in_engine_subaction(card) {
        const sm = GAME_ITEMS['state-machine'];
        const p = get_current_player();
        set_text("Select Engine Card to play.", false, null, 1000);
        // store off arg. Could use closure, but want to be able to remove listener by name.
        StateMachine.play_engine_card_subaction.card = card;
        document.addEventListener("click", StateMachine.play_engine_card_subaction);
        const engine = p.area.querySelector(".engine");
        engine.classList.add("ACTIVE");
        engine.classList.add("PLACING");
    }

    static reset_after_place_in_engine_subaction() {
        const p = get_current_player();
        const card = StateMachine.play_engine_card_subaction.card;
        card.element().classList.remove("selected");

        p.engine_hand.remove(card);
        StateMachine.play_engine_card_subaction.card = null;
        document.removeEventListener("click", StateMachine.play_engine_card_subaction);
        const engine = p.area.querySelector(".engine");
        engine.classList.remove("ACTIVE");
        engine.classList.remove("PLACING");
    }

    static play_engine_card_subaction(event) {
        const placeholder = event.target.closest(".engine-placeholder");
        if (!placeholder) {
            // ignore click
            return;
        }

        const card = StateMachine.play_engine_card_subaction.card;
        const p = get_current_player();
        const row = placeholder.getAttribute('row');
        const col = placeholder.getAttribute('col');
        console.log("putting ", card, "at", row, col);
        p.engine.add_at(row, col, card);


        StateMachine.reset_after_place_in_engine_subaction();
        const sm = GAME_ITEMS['state-machine'];
        sm.start_adversary_turn();
    }






    static power_take_one(c) {
        console.log("power_take_one", c);
        const cg = ColorGrid.get();
        var can_do = false;
        for (const c of cg.cards) {
            if (c.face_up)  {
                can_do = true;
                break;
            }
        }
        if (!can_do) {
            const sm = GAME_ITEMS['state-machine'];
            set_text("No face up Photo Card to take.", true, () => {sm.dispatch_power_queue();}, 1000);
            return;
        }

        set_text("Select face up Photo Card to take", false, null, 1000);
        document.addEventListener("click", StateMachine.take_photo_card_click_listener);
        document.getElementById("color-grid").classList.add("ACTIVE");
        document.getElementById("color-grid").classList.add("ACTIVE-face-up");
    }
    static reset_power_take_one() { 
        document.removeEventListener("click", StateMachine.take_photo_card_click_listener);
        document.getElementById("color-grid").classList.remove("ACTIVE");
    }

    static take_photo_card_click_listener(event) {
        const cg = event.target.closest("#color-grid");
        if (!cg) { return; }

        const cardele = event.target.closest(".photo-card");
        console.log(cardele);
        if (cardele) {
            const c = Card.card_from_ele(cardele);

            if (c.face_up !== true) { 
                console.log("card is face down.");
                return;
            }

            const p = get_current_player();
            c.remove_from_grid();
            p.photo_hand.add(c);

            StateMachine.reset_power_take_one();

            const sm = GAME_ITEMS['state-machine'];
            sm.dispatch_power_queue();
        }
    }




    static power_flip_cross(c) {
        console.log("power_flip_cross", c);
        const cg = ColorGrid.get();

        set_text("Select Photo Card. Flip each card touching that card. ", false, null, 1000);
        document.addEventListener("click", StateMachine.flip_cross_click_listener);
        document.getElementById("color-grid").classList.add("ACTIVE");
        document.getElementById("color-grid").classList.add("ACTIVE-face-down");
    }

    static reset_power_flip_cross() { 
        document.removeEventListener("click", StateMachine.flip_cross_click_listener);
        document.getElementById("color-grid").classList.remove("ACTIVE");
        document.getElementById("color-grid").classList.remove("ACTIVE-face-down");
    }

    static flip_cross_click_listener(event) {
        const cgele = event.target.closest("#color-grid");
        if (!cgele) { return; }

        const cardele = event.target.closest(".photo-card");
        console.log(cardele);
        if (cardele) {
            const cg = GAME_ITEMS['color-grid'];
            const c = Card.card_from_ele(cardele);
            const [col,row] = cg.find(c);

            const left  = (col > 0)         ? cg.get(col-1, row) : null;
            const right = (col < cg.cols-1) ? cg.get(col+1, row) : null;
            const up    = (row > 0)         ? cg.get(col, row-1) : null;
            const down  = (row < cg.rows-1) ? cg.get(col, row+1) : null;

            if (left) {left.flip();}
            if (right) {right.flip();}
            if (down) {down.flip();}
            if (up) {up.flip();}

            StateMachine.reset_power_flip_cross();

            const sm = GAME_ITEMS['state-machine'];
            sm.dispatch_power_queue();
        }
    }



    static power_swap_in_grid(c) {
        console.log("power_swap_in_grid", c);
        const cg = ColorGrid.get();

        set_text("Select Photo Card. Swapt its place with another. ", false, null, 1000);
        document.addEventListener("click", StateMachine.swap_in_grid1);
        document.getElementById("color-grid").classList.add("ACTIVE");
        document.getElementById("color-grid").classList.add("ACTIVE-face-down");
        document.getElementById("color-grid").classList.add("can-click-placeholder");
    }

    static reset_power_swap_in_grid() { 
        // only swap_in_grid2 should be there.
        document.removeEventListener("click", StateMachine.swap_in_grid1);
        document.removeEventListener("click", StateMachine.swap_in_grid2);
        document.getElementById("color-grid").classList.remove("ACTIVE");
        document.getElementById("color-grid").classList.remove("ACTIVE-face-down");
        document.getElementById("color-grid").classList.remove("can-click-placeholder");
        StateMachine.swap_in_grid2.card = null;
    }

    static swap_in_grid1(event) {
        const cgele = event.target.closest("#color-grid");
        if (!cgele) { return; }

        const cardele = event.target.closest(".photo-card");
        console.log(cardele);
        if (cardele) {
            cardele.classList.add("selected");
            document.removeEventListener("click", StateMachine.swap_in_grid1);
            StateMachine.swap_in_grid2.card = cardele;
            document.addEventListener("click", StateMachine.swap_in_grid2);
            set_text("Select card to swap with.", false, null, 1000);
        }
    }
    static swap_in_grid2(event) {
        const cgele = event.target.closest("#color-grid");
        if (!cgele) { return; }

        const cardele = event.target.closest(".photo-card");
        console.log(cardele);
        if (cardele) {
            const other = StateMachine.swap_in_grid2.card;
            console.log("HERE", cardele, other);
            if (cardele == other) {
                console.log("Selected same card...");
                //return;
            }
            other.classList.remove("selected");

            const cg = ColorGrid.get();

            const c1 = Card.card_from_ele(other);
            const c2 = Card.card_from_ele(cardele);
            const i1 = cg.cards.indexOf(c1);
            const i2 = cg.cards.indexOf(c2);
            console.log(i1,i2, cg.cards[i1] == c1, cg.cards[i2] == c2);
            cg.cards[i2] = c1;
            cg.cards[i1] = c2;
            cg.refresh_dom();

            StateMachine.reset_power_swap_in_grid();

            const sm = GAME_ITEMS['state-machine'];
            sm.dispatch_power_queue();
        }
    }













    static do_card_power(card) {
        const power = card.power;
        console.log(`Dispatch activation: ${card.power}.`);
        if (power === 'A') {
            return StateMachine.power_take_one(card);
        }
        else if (power === 'B') {
            return StateMachine.power_flip_cross(card);
        }
        else if (power === 'C') {
            return StateMachine.power_swap_in_grid(card);
        }
        else if (true) { // XXX DEBUG XXX
            return StateMachine.power_take_one(card);
        }
        else {
            const sm = GAME_ITEMS['state-machine'];
            set_text(
                `Power not implemented: ${power}.`,
                true,
                () => {sm.dispatch_power_queue();},
                0
            );
        }

    }

    static activate(card, color, already=[])  {
        const queue = [];
        if (already.includes(card)) {
            return queue; 
        }
        console.log(`Queue activation: ${card.power}, ${color}`);

        queue.push(card);
        already.push(card);

        console.log('right',card.arrow_right.color ===
            color,card.arrow_right.direction === AWAY , card.card_right
            ,card.card_righ && tcard.card_right.arrow_left.color === color
            ,card.card_righ && tcard.card_right.arrow_left.direction === TOWARDS);

        if (   card.arrow_right.color === color
            && card.arrow_right.direction === AWAY
            && card.card_right
            && card.card_right.arrow_left.color === color
            && card.card_right.arrow_left.direction === TOWARDS)
        {
            console.log("RIGHT");
            queue.push(...StateMachine.activate(card.card_right, color, already));
        }

        if (   card.arrow_left.color === color
            && card.arrow_left.direction === AWAY
            && card.card_left
            && card.card_left.arrow_right.color === color
            && card.card_left.arrow_right.direction === TOWARDS)
        {
            console.log("LEFT");
            queue.push(...StateMachine.activate(card.card_left, color, already));
        }

        if (   card.arrow_up.color === color
            && card.arrow_up.direction === AWAY
            && card.card_up
            && card.card_up.arrow_down.color === color
            && card.card_up.arrow_down.direction === TOWARDS)
        {
            console.log("UP");
            queue.push(...StateMachine.activate(card.card_up, color, already));
        }

        if (   card.arrow_down.color === color
            && card.arrow_down.direction === AWAY
            && card.card_down
            && card.card_down.arrow_up.color === color
            && card.card_down.arrow_up.direction === TOWARDS)
        {
            console.log("DOWN");
            queue.push(...StateMachine.activate(card.card_down, color, already));
        }

        return queue;
    }

    start_adversary_turn() {
        this.state = SADTURN;
        console.log("ADVERSARY TURN");

        set_text(
            "Identity Thief turn. <Enter> to draw a card.",
            true,
            () => {this.adversary_draw()},
            0
        );
    }

    adversary_draw() {
        const deck = GAME_ITEMS['adversary-deck'];
        const discard = GAME_ITEMS['adversary-discard'];

        const card = deck.draw();
        card.element().classList.add("selected");
        discard.prepend(card);

        const text = (card.col !== null) ? `[${card.effect}] column ${card.col+1}`
                                         : (card.row !== null) ? `[${card.effect}] row ${card.row+1}`
                                         : `[${card.effect}]`;
        set_text(
            `Card: ${text}`,
            true,
            () => { this.handle_adversary_card(card); },
            0
        );
    }

    handle_adversary_card(card) {

        const effect = card.effect;
        console.log(`Adversary effect: ${card.effect}. c${card.col} r${card.row}`);
        if (effect === 'a') {
            // shuffle
            const cg = ColorGrid.get();
            if (card.col !== null) {
                var do_steal = true;
                for (var row = 0; row < cg.rows; row +=1 ) {
                    const tmp = cg.get(card.col, row);
                    if (!tmp.face_up) {
                        // there is one face down, so no stealing
                        do_steal = false;
                    }
                }
                if (do_steal) {
                    console.log("do steal");
                    for (var row = 0; row < cg.rows; row +=1 ) {
                        // all are face down, let player choose which to take
                        cg.get(card.col, row).element().classList.add("selectable");
                    }
                    StateMachine.setup_steal_select(() => {
                        cg.shuffle_col(card.col);
                        set_text( "done.", true, () => { this.reset_after_adversary_card(card); }, 0);
                    });
                    return;
                }
                else {
                    cg.shuffle_col(card.col);
                }
            }
            else if (card.row !== null) {
                var do_steal = true;
                for (var col = 0; col < cg.cols; col +=1 ) {
                    const tmp = cg.get(col, card.row);
                    if (!tmp.face_up) {
                        // there is one face up, so no stealing
                        do_steal = false;
                    }
                }
                if (do_steal) {
                    console.log("do steal");
                    for (var col = 0; col < cg.cols; col +=1 ) {
                        // all are face down, let player choose which to take
                        cg.get(col, card.row).element().classList.add("selectable");
                    }
                    StateMachine.setup_steal_select(() => {
                        cg.shuffle_col(card.row);
                        set_text( "done.", true, () => { this.reset_after_adversary_card(card); }, 0);
                    });
                    return;
                }
                else {
                    cg.shuffle_col(card.row);
                }
            }
            else {
                throw new Error("Unreachable. Shuffle w/o row or col.");
            }
        }
        else if (effect === 'b') {
            // shuffle
            const cg = ColorGrid.get();
            if (card.col !== null) {
                var do_steal = true;
                for (var row = 0; row < cg.rows; row +=1 ) {
                    const tmp = cg.get(card.col, row);
                    if (tmp.face_up) {
                        // there is one face up, so no stealing
                        do_steal = false;
                    }
                }
                if (do_steal) {
                    console.log("do steal");
                    for (var row = 0; row < cg.rows; row +=1 ) {
                        // all are face down, let player choose which to take
                        cg.get(card.col, row).element().classList.add("selectable");
                    }
                    StateMachine.setup_steal_select(() => {
                        cg.flip_down_col(card.col);
                        set_text( "done.", true, () => { this.reset_after_adversary_card(card); }, 0);
                    });
                    return;
                }
                else {
                    cg.flip_down_col(card.col);
                }
            }
            else if (card.row !== null) {
                var do_steal = true;
                for (var col = 0; col < cg.cols; col +=1 ) {
                    const tmp = cg.get(col, card.row);
                    if (tmp.face_up) {
                        // there is one face up, so no stealing
                        do_steal = false;
                    }
                }
                if (do_steal) {
                    console.log("do steal");
                    for (var col = 0; col < cg.cols; col +=1 ) {
                        // all are face down, let player choose which to take
                        cg.get(col, card.row).element().classList.add("selectable");
                    }
                    StateMachine.setup_steal_select(() => {
                        cg.flip_down_row(card.row);
                        set_text( "done.", true, () => { this.reset_after_adversary_card(card); }, 0);
                    });
                    return;
                }
                else {
                    cg.flip_down_row(card.row);
                }
            }
            else {
                throw new Error("Unreachable. Flip down w/o row or col.");
            }
        }
        else if (effect == AdversaryCard.DATA_BREACH) {
            set_text( "Data breach!! The discard will be shuffled back to the top. (not including this card)", true, () => {
                const discard = GAME_ITEMS['adversary-discard'];
                const deck = GAME_ITEMS['adversary-deck'];

                const cards = discard.cards;
                discard.cards = []
                discard.refresh_dom();

                const tmp = cards.shift();
                console.assert(tmp.effect == AdversaryCard.DATA_BREACH);

                shuffle(cards);

                for (const card of cards) { deck.prepend(card); }

                this.reset_after_adversary_card(card);
            }, 0);
            return;
        }
        else {
            const sm = GAME_ITEMS['state-machine'];
            set_text(
                `Effect not implemented: ${effect}.`,
                true,
                () => {this.reset_after_adversary_card(card);},
                0
            );
        }

        set_text(
                "done.",
                true,
                () => {
                    this.reset_after_adversary_card(card);
                },
                0
        );
    }

    reset_after_adversary_card(card) {
        card.element().classList.remove("selected");
        this.start_next_player_turn();
    }

    static setup_steal_select(after=null) {
        set_text("Select Photo Card to be stolen. :(", false, null, 1000);
        StateMachine.steal_photo_card_click_listener.after = after;
        document.addEventListener("click", StateMachine.steal_photo_card_click_listener);
        //document.getElementById("color-grid").classList.add("ACTIVE");
    }
    static reset_after_steal_select() {
        document.removeEventListener("click", StateMachine.steal_photo_card_click_listener);
        StateMachine.steal_photo_card_click_listener.after = null;
        document.querySelectorAll(".photo-card.selectable").forEach((c) => {
            c.classList.remove("selectable");
        });
        //document.getElementById("color-grid").classList.add("ACTIVE");
    }

    static steal_photo_card_click_listener(event) {
        const cg = event.target.closest("#color-grid");
        if (!cg) { return; }

        const cardele = event.target.closest(".photo-card");
        if (cardele && cardele.classList.contains("selectable")) {
            const c = Card.card_from_ele(cardele);

            c.remove_from_grid();
            c.flip_up(false);
            const stolen = GAME_ITEMS['stolen-cards'];
            stolen.add(c);

            for (const color of COLORS) {
                var count = 0;
                for (const card of stolen.cards) {
                    if (card.color == color) {
                        count += 1;
                        if (count >= 3) {
                            console.log("LOSE");
                            set_text(`Players lose... ${count} ${color} cards.`, true, null, 0);
                            return;
                        }
                    }
                }
            }
            const after = StateMachine.steal_photo_card_click_listener.after;
            StateMachine.reset_after_steal_select();
            if (after) {
                after();
            }
        }
    }
}

function input_handler_ack_text(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const tb = document.getElementById("text-box");
        tb.classList.remove("new-content");

        const tc = document.getElementById("text-content");
        tc.textContent = '';

        const to = document.getElementById("text-options");
        tc.textContent = '';

        if (tb.cb) {
            const cb = tb.cb;
            tb.cb = null;
            cb();
        }
    }
}

function set_text(t, enter_for_ack=true, cb=null, timeout=2*1000) {
    const tb = document.getElementById("text-box");
    const tc = document.getElementById("text-content");
    const to = document.getElementById("text-options");
    to.replaceChildren();

    tc.textContent = t;
    tb.classList.add("new-content");
    tb.cb = cb;
    if (timeout > 0) {
        setTimeout(() => {
            tb.classList.remove("new-content");
        }, timeout);
    }

    if (enter_for_ack) {
        document.addEventListener("keydown", input_handler_ack_text);
    }
    else {
        document.removeEventListener("keydown", input_handler_ack_text);
    }
}

function set_text_with_options(t, options) {
    document.removeEventListener("keydown", input_handler_ack_text);

    const tb = document.getElementById("text-box");
    const tc = document.getElementById("text-content");
    const to = document.getElementById("text-options");
    tc.textContent = t;
    tb.classList.add("new-content");

    to.replaceChildren();

    options.forEach(([text, cb]) => {
        //console.log(text, cb);
        o = document.createElement("span");
        o.classList.add("option");
        o.textContent = text;
        o.onclick = cb;
        to.appendChild(o);
    });
}

function new_player(id) {
    console.log("player", id);
    const areas = document.getElementById("player-areas");

    const player = document.createElement("div");
    player.classList.add("player-area");
    player.id = (`player-area-${id}`);

    const p = new Player(id, player);
    GAME_ITEMS[id] = p;

    //const engine_hand = document.createElement("div");
    //engine_hand.classList.add("engine-hand");
    //engine_hand.textContent = "Engine Hand";
    //const photo_hand = document.createElement("div");
    //photo_hand.textContent = "Photo Hand";
    //photo_hand.classList.add("photo-hand");
    //const engine = document.createElement("div");
    //engine.textContent = "Engine";
    //engine.classList.add("engine");

    var label = document.createElement('div');
    label.textContent = `Player ${id}`;
    label.classList.add("player-id-header");
    player.appendChild(label);

    label = document.createElement('span');
    label.textContent = 'Engine Hand:';
    player.appendChild(label);
    player.appendChild(p.engine_hand.refresh_dom());

    label = document.createElement('span');
    label.textContent = 'Photo Hand:';
    player.appendChild(label);
    player.appendChild(p.photo_hand.refresh_dom());

    label = document.createElement('span');
    label.textContent = 'Engine:';
    player.appendChild(label);
    player.appendChild(p.engine.refresh_dom());

    areas.appendChild(player);

}

function draw_engine_card_to_player_hand(id) {
    deck = GAME_ITEMS['engine-deck'];
    // XXX check for empty deck
    const card = deck.draw();
    const player = GAME_ITEMS[id];
    player.engine_hand.add(card);
}

function add_card_to_engine_stock() {
    const ed = GAME_ITEMS['engine-deck'];
    // XXX check that deck not empty
    const card = ed.draw();

    GAME_ITEMS['engine-stock'].push(card);

    const stock = document.getElementById('engine-stock');
    stock.appendChild(card.element())
}

function remove_card_from_engine_stock(card, replace=true) {
    const stock = GAME_ITEMS['engine-stock'] ;
    const idx = stock.indexOf(card);
    if (idx < 0) {
        throw new Error("Card not found in stock");
    }
    stock.splice(idx, 1);

    if (replace) {
        add_card_to_engine_stock();
    }
}

function player_add_engine_card(player) {
    document.getElementById("engine-stock").classList.add("ACTIVE");
}

function setup() {
    const qs = window.location.search;
    const params = new URLSearchParams(qs);
    const numplayers = parseInt(params.get("players")) ? parseInt(params.get("players")) : 4;

    const sm = new StateMachine();
    GAME_ITEMS['state-machine'] = sm;

    sm.handle_init(numplayers);

    // DEBUG
    /*
    document.addEventListener("click", () => {
        const cg = event.target.closest("#color-grid");
        if (!cg) {
            console.log("click not in color grid");
            return;
        }

        const cardele = event.target.closest(".photo-card");
        console.log(cardele);
        if (cardele) {
            const c = Card.card_from_ele(cardele);
            console.log("debug take.");

            const p = get_current_player();
            c.remove_from_grid();
            p.photo_hand.add(c);
        }
    });
    */
}

document.addEventListener("DOMContentLoaded", setup);

