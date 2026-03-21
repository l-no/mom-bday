class Card {
    static _uid_counter = 0;
    static _cards = [];

    constructor(kind) {
        this.kind = kind;
        this.face_up = false;

        this.uid = Card._uid_counter;
        Card._uid_counter += 1;

        this.element_ = null;

        console.assert(Card._cards.length === this.uid);
        Card._cards.push(this)
        console.assert(Card._cards[this.uid] === this)
    }

    flip_up(strict=true) {
        if (strict && this.face_up) {
            throw new Error("Already face up.");
        }
        this.face_up = true;

        if (this.element_) { this.element_.setAttribute("face-up", this.face_up); }
    }

    flip_down(strict=true) {
        if (strict && !this.face_up) {
            throw new Error("Already face down.");
        }
        this.face_up = false;
        if (this.element_) { this.element_.setAttribute("face-up", this.face_up); }
    }

    static find_by_uid(uid) {
        return this._cards[uid]
    }

    static card_from_ele(ele) {
        const uid = ele.getAttribute("uid");
        if (uid === null) {
            throw new Error("uid not found.");
        }
        return Card.find_by_uid(uid);
    }
}


class Deck {
    constructor(cards=[]) {
        this.cards = cards;
    }

    // google AI
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const rand = new Uint32Array(1);
            window.crypto.getRandomValues(rand); 
            const j = rand[0] % (i + 1); 
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        if (this.cards.length > 0) {
            return this.cards.shift();
        }
        else {
            throw new Error("Deck is empty.");
        }
    }
}
