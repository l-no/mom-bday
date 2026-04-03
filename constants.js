const KIND_Engine = 'engine'
const KIND_Photo = 'photo'
const KIND_Adversary = 'adversary'

const GREEN = 'green';
const BLUE = 'blue';
const PURPLE = 'purple';
const RED = 'red';
const ORANGE = 'orange';
const YELLOW = 'yellow';

const COLORS = [ GREEN, BLUE, PURPLE, RED, ORANGE, YELLOW,];


// ENGINE STUFF
const TOWARDS = 'towards';
const AWAY = 'away';

const PC_STATE_UNINIT  = "pc uninitialized";
const PC_STATE_GRID = "pc in grid";
const PC_STATE_HAND = "pc in hand";

/////////////////////////////////////////
// CONFIG STUFF
/////////////////////////////////////////
const PHOTO_CARDS_OF_EACH_COLOR = 6;
const GRID_ROWS = 6;
const GRID_COLS = 6;
const NUM_STOCK_CARDS = 5;
const NUM_STARTING_CARDS = 2;
const COLOR_SET_SIZE = 4;
const NUM_DATA_BREACH_CARDS = 5;
// XXX every time one of these is drawn, we should draw an extra adversary card
// per turn. (or at least have some progression...)?
const NUM_EACH_ROW_COL_ADV_CARD = 2;
