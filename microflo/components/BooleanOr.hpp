// Functor for PureFunctionComponent2
struct BooleanOr {
    Packet operator() (bool a, bool b) { return Packet(a || b); }
};
