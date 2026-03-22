const GAME_ITEMS = {};

function new_player(id) {
    console.log("player", id);
    const areas = document.getElementById("player-areas");

    const player = document.createElement("div");
    player.classList.add("player-area");

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

    document.getElementById('engine-deck').textContent = '<engine-deck>';
    document.getElementById('engine-deck').onclick = add_card_to_engine_stock;
    document.getElementById('engine-stock').textContent = '<engine-stock>';

    //const ecard = EngineCard.deser("<ablue,>agreen,^tblue,vtgreen,!");
    //document.body.appendChild(ecard.element());

}

document.addEventListener("DOMContentLoaded", setup);

