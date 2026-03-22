const GAME_ITEMS = {};
var STATE = null;

SINIT = 'init';
PTURN = 'turn';
class StateMachine {

    constructor() {
        this.state = SINIT;
        this.whose_turn = null;
    }

    handle_init() {
        const numplayers = GAME_ITEMS['num-players'];
        set_text(`Press Enter to begin ${numplayers}-player game.`, ()=>{this.start_player_turn(1)}, 0);
    }

    start_player_turn(i) {

        this.whose_turn = i;
        const options = [
            ['Take one Engine Card from stock/deck', () => {console.log("TAKE");}],
            ['Play one Engine Card from hand', () => {console.log("Play");}],
            ['Flip one Photo Card in grid', () => {console.log("Flip");}],
            ['Activate Engine', () => {console.log("Activate");}],
        ];
        set_text_with_options(`Player ${i} turn. Select one: `, options);

        document.getElementById(`player-area-${i}`).classList.add("current-turn");
    }
}


function input_handler_ack_text(event) {
    if (event.key === 'Enter' || event.key === ' ') {
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

function set_text(t, cb=null, timeout=2*1000) {
    const tb = document.getElementById("text-box");
    const tc = document.getElementById("text-content");
    tc.textContent = t;
    tb.classList.add("new-content");
    tb.cb = cb;
    if (timeout > 0) {
        setTimeout(() => {
            tb.classList.remove("new-content");
        }, timeout);
    }

    document.addEventListener("keydown", input_handler_ack_text);
}

function set_text_with_options(t, options) {
    const tb = document.getElementById("text-box");
    const tc = document.getElementById("text-content");
    const to = document.getElementById("text-options");
    tc.textContent = t;
    tb.classList.add("new-content");

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

    const engine_hand = document.createElement("div");
    engine_hand.textContent = "Engine Hand";
    const photo_hand = document.createElement("div");
    photo_hand.textContent = "Photo Hand";
    const engine = document.createElement("div");
    engine.textContent = "Engine";

    player.appendChild(engine_hand);
    player.appendChild(photo_hand);
    player.appendChild(engine);

    areas.appendChild(player);
}

function add_card_to_engine_stock() {
    const ed = GAME_ITEMS['engine-deck'];
    const card = ed.draw();

    GAME_ITEMS['engine-stock'].push(card);

    const stock = document.getElementById('engine-stock');
    stock.appendChild(card.element())
}

function player_add_engine_card(player) {
    document.getElementById("engine-stock").classList.add("ACTIVE");
}

function setup() {
    const qs = window.location.search;
    const params = new URLSearchParams(qs);
    const numplayers = parseInt(params.get("players")) ? parseInt(params.get("players")) : 4;
    for (var i = 1; i < numplayers+1; ++i) {
        new_player(i);
    }


    photo_deck = PhotoCard.default_deck();
    photo_deck.shuffle();
    cg = new ColorGrid(photo_deck);
    cg.refresh_dom();


    engine_deck = EngineCard.default_deck();

    GAME_ITEMS['photo-deck'] = photo_deck;
    GAME_ITEMS['engine-deck'] = engine_deck;

    GAME_ITEMS['engine-stock'] = [];
    GAME_ITEMS['num-players'] = numplayers;


    document.getElementById('engine-deck').textContent = '<engine-deck>';
    document.getElementById('engine-deck').onclick = add_card_to_engine_stock;
    document.getElementById('engine-stock').textContent = '<engine-stock>';

    //const ecard = EngineCard.deser("<ablue,>agreen,^tblue,vtgreen,!");
    //document.body.appendChild(ecard.element());

    const sm = new StateMachine();
    GAME_ITEMS['state-machine'] = sm;

    sm.handle_init();
}

document.addEventListener("DOMContentLoaded", setup);

