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
        ele.textContent = "+";
        this.element_ = ele;
        return this.element_;
    }
    
}

class Engine {
    constructor() {
        this.grid = {0 : {0 : new EnginePlaceholder(0,0,true)}};
        this.element_ = null;
    }

    refresh_dom() {
        var ele = this.element_;
        if (!ele) {
            ele = document.createElement("div");
            ele.classList.add("engine");
        }
        const rows = Object.keys(this.grid);
        rows.sort();
        const minrow = rows[0];
        const maxrow = rows[rows.length-1];
        var mincol = null;
        var maxcol = null;
        for (const row of rows) {
            const cols = Object.keys(row);
            cols.sort()
            if (mincol === null || cols[0] < mincol) { mincol = cols[0]; }
            if (maxcol === null || cols[cols.length-1] > maxcol) { maxcol= cols[cols.length-1]; }
        }

        ele.style.gridTemplateColumns = `repeat(${maxcol-mincol}, 1fr)`;
        ele.style.gridTemplatRows = `repeat(${maxrow-minrow}, 1fr)`;

        for (var r = minrow; r <= maxrow; r += 1) {
            for (var c = mincol; c <= maxrow; c += 1) {
                var added = false;
                if (this.grid[r]) {
                    if (this.grid[r][c]) {
                        console.log(r,c, this.grid[r][c]);
                        ele.appendChild(this.grid[r][c].element());
                        added = true;
                    }
                }

                if (!added) {
                    const pholder = new EnginePlaceholder(r,c);
                    ele.appendChild(pholder.element());
                }
            }
        }


        this.element_ = ele;
        return this.element_;
    }
}
