// Functor for PureFunctionComponent2
struct BooleanAnd {
    Packet operator() (bool a, bool b) { return Packet(a && b); }
};
