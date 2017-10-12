@0xfb81504f18c1a924;
struct Message {

  struct Mapping {
    # For component/node/port relationships
    name @0 : Text;
    id @1 : UInt16;
  }
  # ComponentNames
  # NodeNames
  # PortNames

  struct Connection {
    # Connection between two nodes, on two particular ports
    srcnode @0 : UInt16;
    srcport @1 : UInt16;
    tgtnode @2 : UInt16;
    tgtport @3 : UInt16;
  }
  # AddConnection
  # RemoveConnection
  # ConnectionAdded
  # ConnectionRemoved

  struct DataValue {
    # The different
    value :union {
      float @0 : Float32;
      integer @1 : Int32;
      boolean @2 : Bool;
      byte @3 : UInt8;
      void @4 : Void;
    }
  }
  # SendPacket
  # PacketSent
  # AddInitial
  # RemoveInitial
  # InitialRemoved
  # InitialAdded
}
