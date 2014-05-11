// Functor for PureFunctionComponent2
struct NumberEquals {
    Packet operator() (long a, long b) { return Packet(a == b); }
};
