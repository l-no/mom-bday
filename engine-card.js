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
        const strs = [
            'F,<tpurple,>ared,vablue,^tred',
            'C,<tblue,>tblue,vtpurple,^agreen',
            'E,<ayellow,>tyellow,vared,^torange',
            'F,<torange,>tpurple,vagreen,^tgreen',
            'B,<agreen,>ablue,vtblue,^tgreen',
            'E,<apurple,>ayellow,vtgreen,^tgreen',
            'E,<ared,>ablue,vaorange,^ared',
            'E,<aorange,>tred,vablue,^aorange',
            'A,<tblue,>tyellow,vtorange,^aorange',
            'C,<ayellow,>tgreen,vablue,^tgreen',
            'B,<ared,>agreen,vagreen,^ayellow',
            'D,<tred,>agreen,vtpurple,^torange',
            'B,<tblue,>ablue,vtgreen,^agreen',
            'F,<ayellow,>tred,vtblue,^aorange',
            'A,<tred,>aorange,vtpurple,^ablue',
            'D,<tred,>ared,vayellow,^agreen',
            'E,<tblue,>ayellow,vapurple,^tgreen',
            'C,<tred,>tgreen,vtred,^tyellow',
            'D,<tred,>tred,vared,^ared',
            'A,<aorange,>ablue,vagreen,^tblue',
            'B,<aorange,>tyellow,vtred,^aorange',
            'C,<apurple,>apurple,vtgreen,^apurple',
            'A,<torange,>apurple,vapurple,^tgreen',
            'D,<tred,>ablue,vagreen,^ablue',
            'A,<tpurple,>tblue,vtpurple,^tred',
            'F,<ablue,>tyellow,vtred,^tblue',
            'A,<tred,>tred,vablue,^tpurple',
            'E,<torange,>tred,vaorange,^aorange',
            'D,<torange,>apurple,vtorange,^apurple',
            'A,<tred,>ablue,vtgreen,^ared',
            'F,<apurple,>agreen,vaorange,^ared',
            'B,<tblue,>tpurple,vtgreen,^tyellow',
            'A,<tred,>agreen,vapurple,^ayellow',
            'A,<ared,>tred,vagreen,^tyellow',
            'A,<tgreen,>ayellow,vagreen,^tblue',
            'E,<agreen,>tgreen,vtorange,^apurple',
            'A,<torange,>agreen,vtorange,^tpurple',
            'E,<apurple,>tyellow,vablue,^apurple',
            'F,<agreen,>apurple,vtred,^tgreen',
            'D,<tpurple,>tgreen,vared,^ablue',
            'D,<ablue,>tblue,vtorange,^agreen',
            'A,<ared,>agreen,vagreen,^agreen',
            'A,<aorange,>ayellow,vapurple,^tpurple',
            'F,<tred,>ayellow,vtred,^tyellow',
            'C,<tpurple,>torange,vared,^tyellow',
            'E,<tred,>ablue,vtyellow,^torange',
            'E,<tyellow,>apurple,vtgreen,^apurple',
            'C,<torange,>ayellow,vtyellow,^tgreen',
            'B,<ared,>torange,vared,^ared',
            'B,<tyellow,>tpurple,vtblue,^ablue',
            'F,<torange,>tblue,vablue,^apurple',
            'C,<ared,>tred,vagreen,^torange',
            'A,<tpurple,>ablue,vagreen,^tyellow',
            'A,<tyellow,>agreen,vayellow,^tred',
            'A,<agreen,>tpurple,vagreen,^torange',
            'A,<tyellow,>tblue,vtpurple,^ablue',
            'F,<tblue,>tyellow,vagreen,^tgreen',
            'D,<ared,>tred,vtyellow,^aorange',
            'D,<ayellow,>agreen,vtyellow,^ared',
            'F,<tred,>ared,vapurple,^tred',
        ];
        let cards = [];
        for (const s of strs) {
            cards.push(EngineCard.deser(s));
        }
        return new Deck(cards);
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

    activate()  {
        console.log(`Activate: ${this.power}`);
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
