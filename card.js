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
    
    flip() {
        if (this.face_up) { this.flip_down(true); }
        else { this.flip_up(true); }
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


// google AI
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const rand = new Uint32Array(1);
        window.crypto.getRandomValues(rand); 
        const j = rand[0] % (i + 1); 
        [a[i], a[j]] = [a[j], a[i]];
    }
}

class Deck {
    constructor(cards=[]) {
        this.cards = cards;
    }

    shuffle() {
        shuffle(this.cards);
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

class Hand {
    constructor(kind, cards=[]) {
        this.kind = kind;
        this.cards = cards;
        this.element_ = null;
    }

    add(card) {
        this.cards.push(card);
        this.refresh_dom();
    }

    remove(card) {
        const idx = this.cards.indexOf(card);
        if (idx < 0) {
            throw new Error("Card not in hand.");
        }
        this.cards.splice(idx, 1);
        this.refresh_dom();
    }

    refresh_dom() {
        // already in html
        var ele = this.element_;
        if (ele == null) {
            ele = document.createElement("div");
            ele.classList.add("hand");
            if (this.kind === KIND_Photo) {
                ele.classList.add("photo-hand");
            }
            else if (this.kind === KIND_Engine) {
                ele.classList.add("engine-hand");
            }
            else {
                throw new Error(`Invalid kind: ${this.kind}`);
            }
        }
        ele.replaceChildren();

        for (var c of this.cards) {
            if (c === null) {
                console.log("NULL");
            }
            ele.appendChild(c.element());
        }

        this.element_ = ele;
        return this.element_;
    }
}
