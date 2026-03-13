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

        if shuffle:
            deck.shuffle()
        self.deck = deck
        self.cards = deck.cards

        assert all(c.face_up == False for c in deck)


    def term_print(self):
        for i,c in enumerate(self.deck):
            print(f'{Ansi.code(c.color)}X{Ansi.reset()}', end="\n" if ((i+1) % Config.grid_cols) == 0 else ' ')


def _test():
    #d = Deck([PhotoCard(SystemRandom().choice([c for c in PhotoCard.Color])) for _ in range(10)])

    d = PhotoCard.default_deck()
    grid = ColorGrid(d, False)
    grid.term_print()
    #print(len(d))
    #print([c.uid for c in d])
    #d.shuffle()
    #print(d.draw().uid)
    #print([c for c in d])



if __name__ == '__main__':
    _test()
