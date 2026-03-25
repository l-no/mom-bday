class EnginePlaceholder {
    constructor(row, col, can_place=false) {
        this.element_ = null;
        this.row = row;
        this.col = col;
        this.can_place = can_place;
    }
    element() {
        if (this.element_) {
            return this.element_;
        }
        const ele = document.createElement("div");
        ele.classList.add("engine-placeholder");
        if (this.can_place) {
            ele.classList.add("can-place");
        }
        ele.setAttribute('row', this.row);
        ele.setAttribute('col', this.col);
        ele.textContent = "+";
        this.element_ = ele;
        return this.element_;
    }
    
}

class Engine {
    constructor() {
        this.grid = {0 : {0 : new EnginePlaceholder(0,0,true)}};
        //this.grid = {"-1" : {0 : new EnginePlaceholder(-1,0,true)}};
        this.element_ = null;
        this.count = 0;
    }

    log_grid() {
        for (const row of this.grid) {
            for (const entry of row) {
                console.log(entry);
            }
        }
    }

    add_at(row, col, card) {
        row = parseInt(row);
        col = parseInt(col);
        const above = this.grid[row-1]
                    ? (this.grid[row-1][col] ? this.grid[row-1][col] : null)
                    : null;

        const below = this.grid[row+1]
                    ? (this.grid[row+1][col] ? this.grid[row+1][col] : null)
                    : null;

        const left  = this.grid[row]
                    ? (this.grid[row][col-1] ? this.grid[row][col-1] : null)
                    : null;

        const right = this.grid[row]
                    ? (this.grid[row][col+1] ? this.grid[row][col+1] : null)
                    : null;

        if (!above && !below && !left && !right) {
            if (col == 0 && row == 0) {
                // very first thing will be at 0,0 so always allow
            }
            else {
                throw new Error(`Can't place at row ${row}, col ${col}: not touching any cards.`);
            }
        }

        // link the cards
        if (above) { card.set_up(above); }
        if (below) { card.set_down(below); }
        if (left) { card.set_left(left); }
        if (right) { card.set_left(right); }

        if (this[row] === undefined) {
            this[row] = {};
        }
        if (this[row][col] !== undefined) {
            // XXX check type of object.
            throw new Error("must be placeholder there to place.");
        }
        else {
            console.log("replace", this[row][col]);
        }
        console.log("INSERT AT", row, col);
        this.grid[row][col] = card;
        this.count += 1;

        // add spots for more cards
        this.try_add_card_placement_placeholder(row-1, col);
        this.try_add_card_placement_placeholder(row+1, col);
        this.try_add_card_placement_placeholder(row, col-1);
        this.try_add_card_placement_placeholder(row, col+1);

        this.refresh_dom();
    }

    try_add_card_placement_placeholder(row,col) {
        if (!this.grid[row]) {
            this.grid[row] = {};
        }
        if (this.grid[row][col]) {
            // already
            return;
        }
        const pl = new EnginePlaceholder(row, col, true);
        console.log("INSERT PH AT", row, col);
        this.grid[row][col] = pl;
    }

    refresh_dom() {
        var ele = this.element_;
        if (!ele) {
            ele = document.createElement("div");
            ele.classList.add("engine");
        }
        ele.replaceChildren();

        const rows = Object.keys(this.grid).map(x => parseInt(x));
        rows.sort((a,b) => {return a-b;});
        console.log('rowkeys', rows);
        const minrow = parseInt(rows[0]);
        const maxrow = parseInt(rows[rows.length-1]) + 1;
        var mincol = null;
        var maxcol = null;
        for (const row of rows) {
            const cols = Object.keys(this.grid[row]).map(x => parseInt(x));
            console.log('colkeys', cols);
            cols.sort((a,b) => {return a-b;})
            if (mincol === null || cols[0] < mincol) { mincol = cols[0]; }
            if (maxcol === null || cols[cols.length-1] + 1 > maxcol) { maxcol = cols[cols.length-1] + 1; }
        }
        mincol = parseInt(mincol);
        maxcol = parseInt(maxcol);

        const numcol = maxcol - mincol;
        const numrow = maxrow - minrow;
        ele.style.gridTemplateColumns = `repeat(${numcol}, 1fr)`;
        ele.style.gridTemplateRows = `repeat(${numrow}, 1fr)`;
        console.log(ele.style.gridTemplateColumns, ele.style.gridTemplateRows);

        console.log(minrow, maxrow, mincol, maxcol);
        for (var r = minrow; r < maxrow; r += 1) {
            for (var c = mincol; c < maxcol; c += 1) {
                var added = false;
                //console.log('row', r, 'col', c);
                if (this.grid[r]) {
                    if (this.grid[r][c]) {
                        //console.log(r,c, this.grid[r][c]);
                        ele.appendChild(this.grid[r][c].element());
                        added = true;
                    }
                }

                if (!added) {
                    //console.log("created placeholder.");
                    const pholder = new EnginePlaceholder(r,c, false);
                    ele.appendChild(pholder.element());
                }
            }
        }


        this.element_ = ele;
        return this.element_;
    }
}
