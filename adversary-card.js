class AdversaryCard extends Card {
    constructor(effect, row, col) {
        super(KIND_Adversary);

        this.effect = effect;
        this.row = row;
        this.col = col;
    }

    static DATA_BREACH = "Z";

    static default_deck() {
        const cards = [];
        const count = 4;
        for (var i = 0; i < count; i += 1) {
            for (var j = 0; j < GRID_ROWS; j += 1) { cards.push(new AdversaryCard('a', j, null)); }
            for (var j = 0; j < GRID_ROWS; j += 1) { cards.push(new AdversaryCard('b', j, null)); }

            for (var j = 0; j < GRID_COLS; j += 1) { cards.push(new AdversaryCard('a', null, j)); }
            for (var j = 0; j < GRID_COLS; j += 1) { cards.push(new AdversaryCard('b', null, j)); }

            cards.push(new AdversaryCard(AdversaryCard.DATA_BREACH, null, null));
        }

        const d = new Deck(cards, 'Identity Thief Deck');
        d.shuffle();
        return d;
    }

    element() {
        console.log("adv card:", this);
        if (this.element_) {
            return this.element_;
        }

        const card = document.createElement("div");
        card.classList.add("card");
        card.classList.add("adversary-card");
        card.setAttribute("effect", this.effect);
        card.setAttribute('face-up', this.face_up );
        card.setAttribute("uid", this.uid);
        card.textContent = this.col ? `${this.effect}-c${this.col+1}`
                         : this.row ? `${this.effect}-r${this.row+1}`
                                    : `${this.effect}`;
        this.element_ = card;
        return this.element_;
    }
}

