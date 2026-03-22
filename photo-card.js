
class PhotoCard extends Card {

    static default_deck() {
        let cards = [];
        for (const color of COLORS) {
            for (var _i = 0; _i < PHOTO_CARDS_OF_EACH_COLOR; _i += 1) {
                cards.push(new PhotoCard(color));
            }
        }
        return new Deck(cards);
    }

    constructor(color) {
        super(KIND_Photo);
        this.color = color;
        this.state = PC_STATE_UNINIT;
    }

    element() {
        if (this.element_) {
            return this.element_;
        }

        const card = document.createElement("div");
        card.classList.add("card");
        card.classList.add("photo-card");
        card.setAttribute("color", this.color);
        card.setAttribute('face-up', this.face_up );
        card.setAttribute("uid", this.uid);
        this.element_ = card;

        // DEBUG click handler
        this.element_.onclick = (event) => {
            console.log("DEBUG flip.");
            const e = event.target;
            const c = Card.card_from_ele(e);
            //c.flip();
            //c.remove_from_grid(true);
            const cg = ColorGrid.get();
            const idx = cg.cards.indexOf(this);
            const [col,row] = cg.idx_to_row_col(idx);
            console.log(col, row);
            //cg.shuffle_row(row);
            cg.shuffle_col(col);
        };

        return this.element_;
    }


    remove_from_grid(replace=true) {
        if (this.state !== PC_STATE_GRID) {
            throw new Error("Not in grid.");
        }

        if (replace) {
            const pc = new PhotoCard(null);
            const n = pc.element();
            n.classList.add("placeholder");
            n.onclick = null;
            this.element_.replaceWith(n);
            const cg = ColorGrid.get();
            const idx = cg.cards.indexOf(this);
            cg.cards[idx] = pc;
        }
        else {
            this.element_.remove();
        }

    }
}
