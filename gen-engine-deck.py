from secrets import SystemRandom

# match what's in constants.js
GREEN = 'green';
BLUE = 'blue';
PURPLE = 'purple';
RED = 'red';
ORANGE = 'orange';
YELLOW = 'yellow';

COLORS = [ GREEN, BLUE, PURPLE, RED, ORANGE, YELLOW,]


LEFT = '<'
RIGHT = '>'
UP = '^'
DOWN = 'v'

DIRECTIONS = [LEFT, RIGHT, UP, DOWN]

TOWARDS = 't'
AWAY = 'a'

POWERS = [
    'A',
    'B',
    'C',
    'D',
    #'E',
    #'F',
]

def gen_random_card():
    r = SystemRandom()
    while True:
        '''
        invalid = False
        for i in range(4):
            for j in range(i+1, 4):
                if colors[i] == colors[j] and inout[i] != inout[j]:
                    # same color, one comes in, the other goes out:
                    # that means we could build a cycle using this card.
                    # Invalid card.
                    invalid = True
        if invalid:
            continue
        '''

        '''
        inout = [r.choice([TOWARDS, AWAY]) for _ in range(4)]
        power = r.choice(POWERS);
        colors = [r.choice(COLORS) for _ in range(4)]

        return ','.join([
            power,
            '<' + inout[0] + colors[0],
            '>' + inout[1] + colors[1],
            'v' + inout[2] + colors[2],
            '^' + inout[3] + colors[3],
        ])
        '''

        directions = list('<>v^')
        power = r.choice(POWERS)
        r.shuffle(directions)
        
        d1 = directions.pop()
        d2 = directions.pop()
        c1 = r.choice(COLORS)

        c2 = r.choice(COLORS)
        while c1 == c2:
            c2 = r.choice(COLORS)

        d3 = directions.pop()
        d4 = directions.pop()
        return ','.join([
            power,
            d1 + TOWARDS + c1,
            d2 + AWAY + c1,
            d3 + TOWARDS + c2,
            d4 + AWAY + c2,
        ])


def gen_random_deck(count):
    deck = [gen_random_card() for _ in range(count)]
    for c in deck:
        print(c.__repr__() + ',')


gen_random_deck(60)

