class Arrow {
    constructor(direction, color) {
        this.direction = direction;
        this.color = color;
    }
}

class EngineCard extends Card {

    constructor(power, arrow_left, arrow_right, arrow_up, arrow_down) {
        super(KIND_Engine);
        this.power = power;

        this.arrow_left = arrow_left;
        this.arrow_right = arrow_right;
        this.arrow_up = arrow_up;
        this.arrow_down = arrow_down;

        this.card_left = null;
        this.card_right = null;
        this.card_up = null;
        this.card_down  = null;
    }


    static default_deck() {
        let cards = [];
        for (const s of DEFAULT_ENGINE_DECK_STRS) {
            cards.push(EngineCard.deser(s));
        }
        return new Deck(cards, 'Engine Deck');
    }

    //comma separated list of
    //  <direction> <t(oward)|a(way)> <color>
    //e.g.,
    //  >iblue,<ored,...
    static deser(s) {
        const r = new EngineCard(null, null, null, null, null);
        for (const opt of s.split(",")) {
            if ('<>^v'.includes(opt[0])) {
                const inout = opt[1];
                if (!'ta'.includes(inout)) {
                    throw new Error(`Expected a/t (Away/Towards), got ${inout}`);
                }
                const direction = inout == 't' ? TOWARDS : AWAY;
                const color = opt.slice(2,).toLowerCase();
                if (!COLORS.includes(color)) {
                    throw new Error(`Expected valid color, got ${color}`);
                }
                const arrow = new Arrow(direction, color);
                if (opt[0] == '>') {
                    if (r.arrow_right !== null) {
                        throw new Error("repeated");
                    }
                    r.arrow_right = arrow;
                }
                else if (opt[0] == '<') {
                    if (r.arrow_left !== null) {
                        throw new Error("repeated");
                    }
                    r.arrow_left = arrow;
                }
                else if (opt[0] == '^') {
                    if (r.arrow_up !== null) {
                        throw new Error("repeated");
                    }
                    r.arrow_up = arrow;
                }
                else if (opt[0] == 'v') {
                    if (r.arrow_down !== null) {
                        throw new Error("repeated");
                    }
                    r.arrow_down = arrow;
                }
                else {
                    console.assert(null);
                }
            }
            else {
                // XXX no validation currently
                r.power = opt;
            }
        }
        console.assert(r.arrow_left);
        console.assert(r.arrow_right);
        console.assert(r.arrow_up);
        console.assert(r.arrow_down);
        console.assert(r.power);
        return r;
    }

    set_left(other) {
        this.card_left = other;
        other.card_right = this; 
    }
    set_right(other) {
        this.card_right= other;
        other.card_left = this; 
    }
    set_up(other) {
        this.card_up = other;
        other.card_down= this; 
    }
    set_down(other) {
        this.card_down= other;
        other.card_up= this; 
    }

    element() {
        if (this.element_) {
            return this.element_;
        }
        const ele = document.createElement("div");
        ele.classList.add("card");
        ele.classList.add("engine-card");
        ele.setAttribute("uid", this.uid);

        const t =  document.createElement("div");
        t.classList.add("arrow");
        t.classList.add("top-arrow");
        t.setAttribute("color", this.arrow_up.color);
        t.textContent = this.arrow_up.direction == TOWARDS ? "↓" : "↑";

        const b =  document.createElement("div");
        b.classList.add("arrow");
        b.classList.add("bot-arrow");
        b.setAttribute("color", this.arrow_down.color);
        b.textContent = this.arrow_down.direction == AWAY ? "↓" : "↑";


        const l =  document.createElement("span");
        l.classList.add("arrow");
        l.classList.add("left-arrow");
        l.setAttribute("color", this.arrow_left.color);
        l.textContent = this.arrow_left.direction == AWAY ? "←" : "→";


        const r =  document.createElement("span");
        r.classList.add("arrow");
        r.classList.add("right-arrow");
        r.setAttribute("color", this.arrow_right.color);
        r.textContent = this.arrow_right.direction == TOWARDS ? "←" : "→";

        const power = document.createElement("span");
        power.textContent = this.power;

        const wrapper = document.createElement("div");
        wrapper.replaceChildren(l,power,r);
        ele.replaceChildren(t,wrapper,b);


        this.element_ = ele;
        return this.element_;
    }

}
