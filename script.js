const GAME_ITEMS = {};
var STATE = null;

SINIT = 'init';
PTURN = 'playerturn';
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
class StateMachine {

    constructor() {
        this.state = SINIT;
        this.whose_turn = null;
    }

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

        GAME_ITEMS['photo-deck'] = photo_deck;
        GAME_ITEMS['engine-deck'] = engine_deck;

        GAME_ITEMS['engine-stock'] = [];
        GAME_ITEMS['num-players'] = numplayers;


        document.getElementById('engine-deck').textContent = '<engine-deck>';
        document.getElementById('engine-stock').textContent = '<engine-stock>';

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
        this.whose_turn = i;
        const options = [
            ['Take one Engine Card from stock/deck', () => {StateMachine.handle_take_action();}],
            ['Play one Engine Card from hand', () => {StateMachine.handle_play_action();}],
            ['Flip one Photo Card in grid', () => {StateMachine.handle_flip_action();}],
            ['Activate Engine', () => {StateMachine.handle_activate_action();}],
        ];
        set_text_with_options(`Player ${i} turn. Select one: `, options);

        GAME_ITEMS[this.whose_turn].area.classList.add("current-turn");
        //document.getElementById(`player-area-${this.whose_turn}`).classList.add("current-turn");
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
        const sm = GAME_ITEMS['state-machine'];
        const p = get_current_player();
        // store off arg. Could use closure, but want to be able to remove listener by name.
        const options = [];
        for (const color of COLORS) {
            options.push([color, () => {StateMachine.activate_engine_card_with_color(card, color)}]);
        }
        card.classList.add("selected");
        set_text_with_options(`Select activation color: `, options);
    }

    static reset_after_select_action_color_subaction(card) {
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
            StateMachine.handle_select_action_color_subaction();
            set_text(`Card has no ${color} arrows.`, true, () => {StateMachine.handle_select_action_color_subaction(card)}, 0);
            return;
        }

        c.activate(color);
        StateMachine.reset_after_select_action_color_subaction()
        sm.start_adversary_turn();
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
        const cardele = event.target.closest(".photo-card");
        console.log(cardele);
        if (cardele) {
            const c = Card.card_from_ele(cardele);
            // XXX logic for Placeholder cards??
            if (c.face_up === true) { 
                console.log("Already face up.");
                return;
            }
            c.flip_up();

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



    start_adversary_turn() {
        console.log("ADVERSARY TURN");
        //document.getElementById(`player-area-${this.whose_turn}`).classList.remove("current-turn");
        GAME_ITEMS[this.whose_turn].area.classList.remove("current-turn");
        // setup for next player
        this.whose_turn += 1;
        if (this.whose_turn == GAME_ITEMS['num-players'] + 1) {
            this.whose_turn = 1;
        }
        set_text(
            "Identity Thief turn. Press to skip.",
            true,
            () => {this.start_player_turn(this.whose_turn);},
            0
        );


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
        console.log(text, cb);
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
}

document.addEventListener("DOMContentLoaded", setup);

