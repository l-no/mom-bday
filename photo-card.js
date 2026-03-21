
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
    }


    element() {
        if (this.element_) {
            return this.element;
        }

        const card = document.createElement("div");
        card.classList.add("card");
        card.classList.add("photo-card");
        card.classList.add("color-" + this.color);
        card.setAttribute('face-up', this.face_up );
        card.setAttribute("uid", this.uid);
        this.element_ = card;

        // DEBUG click handler
        this.element_.onclick = (event) => {
            const e = event.target;
            const c = Card.card_from_ele(e);
            if (c.face_up) { c.flip_down(); }
            else { c.flip_up(); }
        };

        return this.element_;
    }

}
