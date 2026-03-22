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

function setup() {
    const qs = window.location.search;
    const params = new URLSearchParams(qs);
    const numplayers = parseInt(params.get("players")) ? parseInt(params.get("players")) : 4;
    for (var i = 1; i < numplayers+1; ++i) {
        new_player(i);
    }


    photo_deck = PhotoCard.default_deck();
    //photo_deck.shuffle();
    cg = new ColorGrid(photo_deck);
    cg.refresh_dom();

}

document.addEventListener("DOMContentLoaded", setup);

