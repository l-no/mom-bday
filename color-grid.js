class ColorGrid {
    static _singleton = null;

    static get() {
        if (!ColorGrid._singleton) {
            throw new Error("No ColorGrid.");
        }
        return ColorGrid._singleton;
    }

    constructor(deck) {
        if (ColorGrid._singleton) {
            throw new Error("Already made a colorgrid.");
        }
        this.rows = GRID_ROWS;
        this.cols = GRID_COLS;

        this.deck = deck;
        this.cards = deck.cards;

        for (const c of this.cards) {
            console.assert(!c.face_up);
            c.state = PC_STATE_GRID;

            // DEBUG
            //c.flip();
        }
        console.assert(this.rows == this.cols);
        for (var i = 0; i < this.cols; i += 1) {
            this.get(i,i).flip_up(false);
        }

        this.element_ = null;

        ColorGrid._singleton = this;
    }

    refresh_dom() {
        // already in html
        const ele = document.getElementById("color-grid");
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



    row_col_to_idx(row, col) {
        return row * this.cols + col;
    }

    idx_to_row_col(idx) {
        const col = idx % this.cols;
        const row = Math.floor(idx / this.cols);
        return [col, row];
    }

    flip_down_row(row) {
        for (var col = 0; col < GRID_COLS; col += 1) {
            const idx = this.row_col_to_idx(row, col);
            this.cards[idx].flip_down(false);
        }
    }

    flip_down_col(col) {
        for (var row = 0; row < GRID_COLS; row += 1) {
            const idx = this.row_col_to_idx(row, col);
            this.cards[idx].flip_down(false);
        }
    }


    shuffle_row(row) {
        const tmp = [];
        for (var col = 0; col < GRID_COLS; col += 1) {
            const idx = this.row_col_to_idx(row, col);
            tmp.push(this.cards[idx]);
            this.cards[idx] = null;
        }

        shuffle(tmp);

        var curcol = 0;
        var placeholder_col = GRID_COLS - 1;

        for (var i = 0; i < tmp.length; i += 1) {
            //console.log(tmp[i].element());
            var idx = null;
            if (tmp[i].element().classList.contains("placeholder")) {
                // insert placeholders at end of row
                idx = this.row_col_to_idx(row, placeholder_col);
                placeholder_col -= 1;
            }
            else {
                idx = this.row_col_to_idx(row, curcol);
                curcol += 1;
            }
            this.cards[idx] = tmp[i];
        }

        this.refresh_dom()
    }

    shuffle_col(col) {
        const tmp = [];
        for (var row = 0; row < GRID_ROWS; row += 1) {
            const idx = this.row_col_to_idx(row, col);
            tmp.push(this.cards[idx]);
            this.cards[idx] = null;
        }

        shuffle(tmp);

        var currow = 0;
        var placeholder_row = GRID_ROWS - 1;

        for (var i = 0; i < tmp.length; i += 1) {
            //console.log(tmp[i].element());
            var idx = null;
            if (tmp[i].element().classList.contains("placeholder")) {
                // insert placeholders at end of row
                idx = this.row_col_to_idx(placeholder_row, col);
                placeholder_row -= 1;
            }
            else {
                idx = this.row_col_to_idx(currow, col);
                currow += 1;
            }
            this.cards[idx] = tmp[i];
        }

        this.refresh_dom()
    }

    get(col, row) {
        console.assert(col >= 0);
        console.assert(row >= 0);
        if (col >= this.cols) {
            throw new Error(`Column index exceeds number of columns: ${col} >= ${this.cols}`);
        }
        if (row >= this.rows) {
            throw new Error(`Row index exceeds number of rows: ${row} >= ${this.rows}`);
        }
        const idx = row * this.cols + col;
        const c = this.cards[idx];
        return c
    }



    /*
    shuffle_row(row):
        r = [this.take(c, row) for c in range(this.cols)]
        r = [card for card in r if card is not None]
        SystemRandom().shuffle(r);
        for col in range(this.cols):
            if col < len(r):
                this._put(r[col], col, row)
            else:
                this._put(None, col, row)
    */
    /*
    _get(col, row, remove=false) {
        console.assert(col >= 0);
        console.assert(row >= 0);
        if (col >= this.cols) {
            throw new Error(`Column index exceeds number of columns: ${col} >= ${this.cols}`);
        }
        if (row >= this.rows) {
            throw new Error(`Row index exceeds number of rows: ${row} >= ${this.rows}`);
        }
        const idx = row * this.cols + col;
        c = this.cards[idx];
        if (remove) {
            this.cards[idx] = null;
        }
        return c
    }
    shuffle_col(col):
        c = [this.take(col, row) for row in range(this.rows)]
        c = [card for card in c if card is not None]
        SystemRandom().shuffle(c);
        for row in range(this.rows):
            if row < len(c):
                this._put(c[row], col, row)
            else:
                this._put(None, col, row)
    */
}



/*
def _put(this, card, col, row):
    assert col >= 0
    assert row >= 0
    if col >= this.cols:
        raise ValueError(f"Column index exceeds number of columns: {col} >= {this.cols}")
    if row >= this.rows:
        raise ValueError(f"Column index exceeds number of columns: {col} >= {this.rows}")
    idx = row * this.cols + col
    if this.cards[idx]:
        raise ValueError(f"Can't _put over existing card.")
    this.cards[idx] = card

def flip_up(this, col, row, strict=True):
    c = this._get(col, row)
    c.flip_up(strict)
    return c

def flip_down(this, col, row, strict=True):
    c = this._get(col, row)
    c.flip_down(strict)
    return c

def flip_down_row(this, row):
    for col in range(this.cols):
        this.flip_down(col, row, strict=False)

def flip_down_col(this, col):
    for row in range(this.rows):
        this.flip_down(col, row, strict=False)

def shuffle_row(this, row):
    r = [this.take(c, row) for c in range(this.cols)]
    r = [card for card in r if card is not None]
    SystemRandom().shuffle(r);
    for col in range(this.cols):
        if col < len(r):
            this._put(r[col], col, row)
        else:
            this._put(None, col, row)

def shuffle_col(this, col):
    c = [this.take(col, row) for row in range(this.rows)]
    c = [card for card in c if card is not None]
    SystemRandom().shuffle(c);
    for row in range(this.rows):
        if row < len(c):
            this._put(c[row], col, row)
        else:
            this._put(None, col, row)
    


def take(this, col, row):
    return this._get(col, row, remove=True)


def term_print(this):
    alpha = 'abcdefghijklmnopqrstuvwxyz'
    assert this.cols < len(alpha)
    spacing = 3
    max_num_size = len(f'{this.rows}')
    print(" "*(max_num_size + spacing), end='')
    for i in range(this.cols):
        print(f'{alpha[i]}', end="\n" if ((i+1) % this.cols) == 0 else ' ')
    print("")
    
    rowidx = 0
    for i,c in enumerate(this.deck):
        if i  % this.cols == 0:
            print(f"{rowidx:{max_num_size}}{' ' * spacing}", end="")
            rowidx += 1
        
        end = f"{' '*spacing}{rowidx-1}\n" if ((i+1) % this.cols) == 0 else ' '
        if c is None:
            print(f'.', end=end)
        else:
            if c.face_up:
                print(f'{Ansi.code(c.color)}X{Ansi.reset()}', end=end)
            else:
                print(f'o', end=end)


    print("")
    print(" "*(max_num_size + spacing), end='')
    for i in range(this.cols):
        print(f'{alpha[i]}', end="\n" if ((i+1) % this.cols) == 0 else ' ')
    print("")
*/
