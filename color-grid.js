class ColorGrid {
    constructor(deck) {
        this.rows = GRID_ROWS
        this.cols = GRID_COLS

        this.deck = deck
        this.cards = deck.cards

        for (const c of this.cards) { console.assert(!c.face_up); }

        this.element_ = null;

    }

    add_to_dom() {

        console.assert(!this.element_);

        // already in grid
        //const ele = document.createElement("div");
        //ele.classList.add("color-grid");
        const ele = document.getElementById("color-grid");

        for (const c of this.cards) { ele.appendChild(c.element()); }

        this.element_ = ele;
        return this.element_;
    }

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
