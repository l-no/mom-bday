from secrets import SystemRandom
from enum import Enum
from dataclasses import dataclass
import sys


class Card:
    uid_counter = 0
    _cards = []

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

        assert len(Card._cards) == self.uid
        Card._cards.append(self)
        assert Card._cards[self.uid] == self

    def flip_up(self, strict=True):
        if strict and self.face_up:
            raise ValueError("Already face up.")
        self.face_up = True

    def flip_down(self, strict=True):
        if strict and not self.face_up:
            raise ValueError("Already face down.")
        self.face_up = False


    @staticmethod
    def find_by_uid(uid):
        return self._cards[uid]

class Config:
    photo_cards_of_each_color = 6

    grid_rows = 6
    grid_cols = 6


class Ansi:
    def code(color):
        match color:
            case Color.Green | Color.Green:
                return '\x1b[38;5;46m'
            case Color.Blue | Color.Blue:
                return '\x1b[38;5;21m'
            case Color.Red | Color.Red:
                return '\x1b[38;5;198m'
            case Color.Yellow | Color.Yellow:
                return '\x1b[38;5;226m'
            case Color.Purple | Color.Purple:
                return '\x1b[38;5;200m'
            case Color.Orange | Color.Orange:
                return '\x1b[38;5;208m'
            case _:
                assert False, "unreachable"
    def reset():
        return '\x1b[0m'


    def cursor_up(count):
        sys.stdout.write(f'\x1b[{count}A')
        sys.stdout.flush()
    def cursor_down(count):
        sys.stdout.write(f'\x1b[{count}B')
        sys.stdout.flush()
    def cursor_right(count):
        sys.stdout.write(f'\x1b[{count}C')
        sys.stdout.flush()
    def cursor_left(count):
        sys.stdout.write(f'\x1b[{count}D')
        sys.stdout.flush()
    def clear_screen():
        sys.stdout.write(f'\x1b[2J')
        sys.stdout.flush()
    def cursor_to_topleft():
        sys.stdout.write(f'\x1b[H')
        sys.stdout.flush()
    def save_cursor():
        sys.stdout.write(f'\x1b[s')
        sys.stdout.flush()
    def restore_cursor():
        sys.stdout.write(f'\x1b[u')
        sys.stdout.flush()

    # google ai
    def get_visible_length(s):
        import re
        """
        Calculates the length of a string ignoring ANSI escape codes.

        Args:
            s (str): The input string potentially containing ANSI codes.

        Returns:
            int: The length of the string without the escape codes.
        """
        # Regex pattern to match typical ANSI color codes (SGR sequences)
        ansi_pattern = re.compile(r'\x1b\[[0-9;]*m')
        # Substitute all matches with an empty string
        clean_string = ansi_pattern.sub('', s)
        # Return the length of the resulting clean string
        return len(clean_string)
        
class EngineCard(Card):
    class Power(Enum):
        FlipAny   = '!'
        FlipCross = '+'

    @dataclass
    class Arrow:
        # can't use real type here because EngineCard won't exist when decorator decorates
        direction: None
        color: None

        class Direction(Enum):
            Toward = 'toward'
            Away   = 'away'

        def __repr__(self):
            return f'{Ansi.code(self.color)}{self.direction.name}{Ansi.reset()}'

    def __repr__(self):
        return f'[{self.power} (^ {self.arrow_up}) (v {self.arrow_down}) (< {self.arrow_left}) (> {self.arrow_right})]'

    # comma separated list of
    #   <direction> <t(oward)|a(way)> <color>
    # e.g.,
    #   >iblue,<ored,...
    def deser(s):
        r = EngineCard(None, None, None, None, None)
        for opt in s.split(","):
            if opt[0] in '<>^v':
                inout = opt[1]
                if inout not in 'ta':
                    raise ValueError(f"Expected a/t (Away/Towards), got {inout}")
                direction = EngineCard.Arrow.Direction.Toward if inout == 't' else EngineCard.Arrow.Direction.Away
                color = Color(opt[2:].lower())
                arrow = EngineCard.Arrow(direction=direction, color=color)
                if opt[0] == '>':
                    if r.arrow_right is not None:
                        raise ValueError("repeated")
                    r.arrow_right = arrow
                elif opt[0] == '<':
                    if r.arrow_left is not None:
                        raise ValueError("repeated")
                    r.arrow_left = arrow
                elif opt[0] == '^':
                    if r.arrow_up is not None:
                        raise ValueError("repeated")
                    r.arrow_up = arrow
                elif opt[0] == 'v':
                    if r.arrow_down is not None:
                        raise ValueError("repeated")
                    r.arrow_down = arrow
                else:
                    assert False
            else:
                try:
                    r.power = EngineCard.Power(opt)
                except Exception as e:
                    raise ValueError(f"Deser error: {e}")
        assert r.arrow_left
        assert r.arrow_right
        assert r.arrow_up
        assert r.arrow_down
        assert r.power
        return r

    def activate(self):
        print("Activate")
        print(self)
        #self.ansi_print()
        #print("")

    def ansi_print(self):
        s = '''
           +------------+
           |     |      |
           |     v      |
           |            |
           | <-  +  ->  |
           |            |
           |     |      |
           |     v      |
           +------------+
        '''
        s = '\n'.join(l.strip() for l in s.strip().split("\n"))
        Ansi.save_cursor()
        sys.stdout.write(s)
        Ansi.restore_cursor()
        Ansi.cursor_right(6)
        Ansi.cursor_down(1)

        sys.stdout.write(Ansi.code(self.arrow_up.color))
        if self.arrow_up.direction == EngineCard.Arrow.Direction.Toward:
            sys.stdout.write("|")
            Ansi.cursor_down(1)
            Ansi.cursor_left(1)
            sys.stdout.write("V")
        else:
            sys.stdout.write("^")
            Ansi.cursor_down(1)
            Ansi.cursor_left(1)
            sys.stdout.write("|")
        sys.stdout.write(Ansi.reset())

        Ansi.cursor_left(1)
        Ansi.cursor_down(4)

        sys.stdout.write(Ansi.code(self.arrow_down.color))
        if self.arrow_down.direction == EngineCard.Arrow.Direction.Toward:
            sys.stdout.write("^")
            Ansi.cursor_down(1)
            Ansi.cursor_left(1)
            sys.stdout.write("|")
        else:
            sys.stdout.write("|")
            Ansi.cursor_down(1)
            Ansi.cursor_left(1)
            sys.stdout.write("v")
        sys.stdout.write(Ansi.reset())

        Ansi.cursor_right(2)
        Ansi.cursor_up(3)

        sys.stdout.write(Ansi.code(self.arrow_right.color))
        if self.arrow_right.direction == EngineCard.Arrow.Direction.Toward:
            sys.stdout.write("<")
            sys.stdout.write("-")
        else:
            sys.stdout.write("-")
            sys.stdout.write(">")
        sys.stdout.write(Ansi.reset())

        Ansi.cursor_left(9)

        sys.stdout.write(Ansi.code(self.arrow_left.color))
        if self.arrow_left.direction == EngineCard.Arrow.Direction.Toward:
            sys.stdout.write("-")
            sys.stdout.write(">")
        else:
            sys.stdout.write("<")
            sys.stdout.write("-")
        sys.stdout.write(Ansi.reset())

        Ansi.restore_cursor()


    def print_all(self, recursed=False):

        self.ansi_print()
        cur = self.card_right
        count = 0
        while cur:
            count += 1
            Ansi.cursor_right(15)
            cur.ansi_print()
            cur = cur.card_right
        while count:
            Ansi.cursor_left(15)
            count -= 1

    def set_left(self, other):
        self.card_left = other
        other.card_right = self
    def set_right(self, other):
        self.card_right= other
        other.card_left = self
    def set_up(self, other):
        self.card_up = other
        other.card_down= self
    def set_down(self, other):
        self.card_down= other
        other.card_up= self


    def build_engine_graph(node):
        g = {}

        col = 0
        row = 0

        def add(n, col, row):
            #print(col, row, g)
            if row not in g:
                g[row] = {}

            if col in g[row]:
                if g[row][col] is not n:
                    raise ValueError("invalid graph")
            else:
                g[row][col] = n

                if n.card_right:
                    add(n.card_right, col+1, row)
                if n.card_left:
                    add(n.card_left, col-1, row)
                if n.card_up:
                    add(n.card_up, col, row-1)
                if n.card_down:
                    add(n.card_down, col, row+1)

        add(node,0,0)

        minrow = min(g.keys())
        rowoffset = -minrow if minrow < 0 else 0

        mincol = min(min(x.keys()) for _,x in g.items())
        coloffset = -mincol if mincol < 0 else 0

        real = {row+rowoffset : {col+coloffset : g[row][col] for col in g[row].keys()} for row in g.keys()}
        return real


    def follow_engine(node, color, already=[]):
        if node not in already:
            already.append(node)
        else:
            return
        node.activate()

        if (node.card_right and
            node.arrow_right.direction == EngineCard.Arrow.Direction.Away and
            node.card_right.arrow_left.direction == EngineCard.Arrow.Direction.Toward and
            color == node.card_right.arrow_left.color and
            color == node.arrow_right.color
        ):
            node.card_right.follow_engine(color)

        if (node.card_left and
            node.arrow_left.direction == EngineCard.Arrow.Direction.Away and
            node.card_left.arrow_right.direction == EngineCard.Arrow.Direction.Toward and
            color == node.card_left.arrow_right.color and
            color == node.arrow_left.color
        ):
            node.card_left.follow_engine(color)

        if (node.card_up and
            node.arrow_up.direction == EngineCard.Arrow.Direction.Away and
            node.card_up.arrow_down.direction == EngineCard.Arrow.Direction.Toward and
            color == node.card_up.arrow_down.color and
            color == node.arrow_up.color
        ):
            node.card_up.follow_engine(color)


        if (node.card_down and
            node.arrow_down.direction == EngineCard.Arrow.Direction.Away and
            node.card_down.arrow_up.direction == EngineCard.Arrow.Direction.Toward and
            color == node.card_down.arrow_up.color and
            color == node.arrow_down.color
        ):
            node.card_down.follow_engine(color)



    def test_print_graph(node):
        g = node.build_engine_graph()
        assert min(g.keys()) >= 0
        maxrow = max(g.keys())

        assert min(min(x.keys()) for _,x in g.items()) >= 0
        maxcol = max(max(x.keys()) for _,x in g.items())

        width = 60
        # be careful of unprintable
        for row in range(0, maxrow+1):
            for col in range(0, maxcol+1):
                if row in g and col in g[row]:
                    s = str(g[row][col])
                    l = Ansi.get_visible_length(s)
                    assert width > l
                    s += ' '*(width-l)
                    print(s, end='')
                else:
                    s = ' '*width
                    print(s, end='')
            print("")
                 



    def __init__(self, power, arrow_left, arrow_right, arrow_up, arrow_down):
        Card.__init__(self, kind=Card.Kind.Engine)
        self.power = power

        self.arrow_left = arrow_left
        self.arrow_right = arrow_right  
        self.arrow_up = arrow_up
        self.arrow_down = arrow_down

        self.card_left = None
        self.card_right = None
        self.card_up = None
        self.card_down  = None




class Color(Enum):
    Green = 'green'
    Blue = 'blue'
    Red = 'red'
    Yellow = 'yellow'
    Purple = 'purple'
    Orange = 'orange'


class PhotoCard(Card):

    def __repr__(self):
        return f'{str(self.color.name)}_{self.uid}'
    def __str__(self):
        return self.__repr__()

    @staticmethod
    def default_deck():
        return Deck(cards=[
            PhotoCard(color)
            for color in Color
            for _ in range(Config.photo_cards_of_each_color)
        ])

    def __init__(self, color):
        Card.__init__(self, kind=Card.Kind.Photo)
        if not isinstance(color, Color):
            raise ValueError(f"Expected Color, got {type(kind)}")
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
            
            end = f"{' '*spacing}{rowidx-1}\n" if ((i+1) % self.cols) == 0 else ' '
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

class Player:
    def __init__(self):
        pass

    def add_to_engine(self, card, uid, direction):
        o = Card.find_by_uid(uid)
        if o.owner != self:
            raise ValueError("wrong player owns card")

        card.owner = self
        if direction == "right":
            if o.card_right is not None:
                raise ValueError("Already filled")
            o.set_right(card)
        elif direction == "left":
            if o.card_left is not None:
                raise ValueError("Already filled")
            o.set_left(card)
        elif direction == "up":
            if o.card_up is not None:
                raise ValueError("Already filled")
            o.set_up(card)
        elif direction == "down":
            if o.card_down is not None:
                raise ValueError("Already filled")
            o.set_down(card)


    





def _test():
    #d = Deck([PhotoCard(SystemRandom().choice([c for c in Color])) for _ in range(10)])

    '''
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
    '''
    e = EngineCard.deser("<ablue,>ablue,^tblue,vablue,!")
    e2 = EngineCard.deser("<ablue,>agreen,^tblue,vtgreen,!")
    e3 = EngineCard.deser("<ablue,>tblue,^tred,vtred,!")
    e4 = EngineCard.deser("<ayellow,>tblue,^ablue,vtyellow,!")
    e5 = EngineCard.deser("<apurple,>ablue,^tpurple,vablue,!")
    #print(e.left, e.right, e.up, e.down)
    e.set_down(e2)
    e2.set_left(e3)
    e3.set_left(e4)
    e4.set_up(e5)
    #e5.set_right(e)

    #e.print_all()
    #Ansi.clear_screen()
    #Ansi.cursor_to_topleft()
    #e.print_all()
    #e.ansi_print()
    #Ansi.cursor_right(20)
    #e2.ansi_print()
    #g = e.build_engine_graph() 
    #print(g)
    e.test_print_graph()
    e.follow_engine(Color.Blue)



if __name__ == '__main__':
    _test()
