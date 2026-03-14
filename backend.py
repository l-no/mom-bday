from secrets import SystemRandom
from enum import Enum


class Card:
    uid_counter = 0

    class Kind(Enum):
        Engine = 'engine'
        Photo = 'photo'
        Adversary = 'adversary'

    def __init__(self, kind):
        if not isinstance(kind, Card.Kind):
            raise ValueError(f"Expected Card.Kind, got {type(kind)}")
        self.kind = kind

        self.uid = Card.uid_counter
        Card.uid_counter += 1

        self.face_up = False

    def flip_up(self, strict=True):
        if strict and self.face_up:
            raise ValueError("Already face up.")
        self.face_up = True

    def flip_down(self, strict=True):
        if strict and not self.face_up:
            raise ValueError("Already face down.")
        self.face_up = False

class Config:
    photo_cards_of_each_color = 6

    grid_rows = 6
    grid_cols = 6


class Ansi:
    def code(color):
        match color:
            case PhotoCard.Color.Green:
                return '\x1b[38;5;46m'
            case PhotoCard.Color.Blue:
                return '\x1b[38;5;21m'
            case PhotoCard.Color.Red:
                return '\x1b[38;5;198m'
            case PhotoCard.Color.Yellow:
                return '\x1b[38;5;226m'
            case PhotoCard.Color.Purple:
                return '\x1b[38;5;200m'
            case PhotoCard.Color.Orange:
                return '\x1b[38;5;208m'
            case _:
                assert False, "unreachable"
        
    def reset():
        return '\x1b[0m'


class PhotoCard(Card):
    class Color(Enum):
        Green = 'green'
        Blue = 'blue'
        Red = 'red'
        Yellow = 'yellow'
        Purple = 'purple'
        Orange = 'orange'


    def __repr__(self):
        return f'{str(self.color.name)}_{self.uid}'
    def __str__(self):
        return self.__repr__()

    @staticmethod
    def default_deck():
        return Deck(cards=[
            PhotoCard(color)
            for color in PhotoCard.Color
            for _ in range(Config.photo_cards_of_each_color)
        ])

    def __init__(self, color):
        Card.__init__(self, kind=Card.Kind.Photo)
        if not isinstance(color, PhotoCard.Color):
            raise ValueError(f"Expected PhotoCard.Color, got {type(kind)}")
        self.color = color


class Deck:
    def __init__(self, cards=None):
        if cards is None:
            self.cards = []
        else:
            self.cards = cards

    def __iter__(self):
        return self.cards.__iter__()

    def __len__(self):
        return len(self.cards)

    def shuffle(self):
        SystemRandom().shuffle(self.cards)

    def draw(self):
        if len(self.cards) > 0:
            return self.cards.pop(0)
        raise ValueError("Deck is empty")

class ColorGrid:
    def __init__(self, deck, shuffle=True):
        assert isinstance(deck, Deck)
        assert len(deck) == Config.grid_rows * Config.grid_cols
        self.rows = Config.grid_rows
        self.cols = Config.grid_cols

        if shuffle:
            deck.shuffle()
        self.deck = deck
        self.cards = deck.cards

        assert all(c.face_up == False for c in deck)

    def _get(self, col, row, remove=False):
        assert col >= 0
        assert row >= 0
        if col >= self.cols:
            raise ValueError(f"Column index exceeds number of columns: {col} >= {self.cols}")
        if row >= self.rows:
            raise ValueError(f"Column index exceeds number of columns: {col} >= {self.rows}")
        idx = row * self.cols + col
        c = self.cards[idx]
        if remove:
            self.cards[idx] = None
        return c

    def _put(self, card, col, row):
        assert col >= 0
        assert row >= 0
        if col >= self.cols:
            raise ValueError(f"Column index exceeds number of columns: {col} >= {self.cols}")
        if row >= self.rows:
            raise ValueError(f"Column index exceeds number of columns: {col} >= {self.rows}")
        idx = row * self.cols + col
        if self.cards[idx]:
            raise ValueError(f"Can't _put over existing card.")
        self.cards[idx] = card

    def flip_up(self, col, row, strict=True):
        c = self._get(col, row)
        c.flip_up(strict)
        return c

    def flip_down(self, col, row, strict=True):
        c = self._get(col, row)
        c.flip_down(strict)
        return c

    def flip_down_row(self, row):
        for col in range(self.cols):
            self.flip_down(col, row, strict=False)

    def flip_down_col(self, col):
        for row in range(self.rows):
            self.flip_down(col, row, strict=False)

    def shuffle_row(self, row):
        r = [self.take(c, row) for c in range(self.cols)]
        r = [card for card in r if card is not None]
        SystemRandom().shuffle(r);
        for col in range(self.cols):
            if col < len(r):
                self._put(r[col], col, row)
            else:
                self._put(None, col, row)

    def shuffle_col(self, col):
        c = [self.take(col, row) for row in range(self.rows)]
        c = [card for card in c if card is not None]
        SystemRandom().shuffle(c);
        for row in range(self.rows):
            if row < len(c):
                self._put(c[row], col, row)
            else:
                self._put(None, col, row)
        


    def take(self, col, row):
        return self._get(col, row, remove=True)


    def term_print(self):
        alpha = 'abcdefghijklmnopqrstuvwxyz'
        assert self.cols < len(alpha)
        spacing = 3
        max_num_size = len(f'{self.rows}')
        print(" "*(max_num_size + spacing), end='')
        for i in range(self.cols):
            print(f'{alpha[i]}', end="\n" if ((i+1) % self.cols) == 0 else ' ')
        print("")
        
        rowidx = 0
        for i,c in enumerate(self.deck):
            if i  % self.cols == 0:
                print(f"{rowidx:{max_num_size}}{' ' * spacing}", end="")
                rowidx += 1
            
            end = "\n" if ((i+1) % self.cols) == 0 else ' '
            if c is None:
                print(f'.', end=end)
            else:
                if c.face_up:
                    print(f'{Ansi.code(c.color)}X{Ansi.reset()}', end=end)
                else:
                    print(f'o', end=end)


        print("")
        print(" "*(max_num_size + spacing), end='')
        for i in range(self.cols):
            print(f'{alpha[i]}', end="\n" if ((i+1) % self.cols) == 0 else ' ')
        print("")


def _test():
    #d = Deck([PhotoCard(SystemRandom().choice([c for c in PhotoCard.Color])) for _ in range(10)])

    d = PhotoCard.default_deck()
    grid = ColorGrid(d, True)
    grid.flip_up(0,0)
    grid.flip_up(1,1)
    grid.flip_up(2,1)
    grid.flip_up(5,5)
    grid.flip_up(3,1)
    grid.term_print()
    grid.flip_down_col(0)
    grid.take(3,1)
    #grid.shuffle_row(1)
    grid.take(1,2)
    grid.shuffle_col(1)
    grid.term_print()
    #print(len(d))
    #print([c.uid for c in d])
    #d.shuffle()
    #print(d.draw().uid)
    #print([c for c in d])



if __name__ == '__main__':
    _test()
