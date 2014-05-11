// Functor for PureFunctionComponent2
struct Max {
    Packet operator() (long input, long threshold) {
        if (input <= threshold)
            return Packet(threshold);
        else
            return Packet(input);
    }
};
