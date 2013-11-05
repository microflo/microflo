/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#include <node.h>
#include <v8.h>

#define HOST_BUILD
#define MICROFLO_NO_MAIN
#include "microflo/microflo.hpp"
#include "microflo/host.hpp"

// Packet
v8::Handle<v8::Value> PacketToJsObject(const Packet &p) {
    v8::HandleScope scope;
    v8::Persistent<v8::Object> obj = v8::Persistent<v8::Object>::New(v8::Object::New());
    obj->Set(v8::String::NewSymbol("type"), v8::Number::New(p.type()));
    v8::Handle<v8::Value> val = v8::Undefined();

    // TODO: extend to cover all types
    if (p.isInteger()) {
        val = v8::Number::New(p.asInteger());
    }
    obj->Set(v8::String::NewSymbol("value"), val);
    return scope.Close(obj);
}

Packet JsValueToPacket(v8::Handle<v8::Value> val) {
    if (val->IsNumber()) {
        return Packet((long)val->Int32Value());
    }
    return Packet();
}

// Component
class JavaScriptComponent : public node::ObjectWrap, public Component  {
public:
    static void Init(v8::Handle<v8::Object> exports);

    // Implements Component
    virtual void process(Packet in, int port);
private:
    ~JavaScriptComponent();

    static v8::Handle<v8::Value> New(const v8::Arguments& args);
    static v8::Handle<v8::Value> On(const v8::Arguments& args);
    static v8::Handle<v8::Value> Send(const v8::Arguments& args);
private:
    v8::Persistent<v8::Function> onProcess;
};

JavaScriptComponent::~JavaScriptComponent()
{}

void JavaScriptComponent::Init(v8::Handle<v8::Object> exports) {
  // Prepare constructor template
  v8::Local<v8::FunctionTemplate> tpl = v8::FunctionTemplate::New(New);
  tpl->SetClassName(v8::String::NewSymbol("Component"));
  tpl->InstanceTemplate()->SetInternalFieldCount(2);
  // Prototype
  tpl->PrototypeTemplate()->Set(v8::String::NewSymbol("on"),
                                v8::FunctionTemplate::New(On)->GetFunction());
  tpl->PrototypeTemplate()->Set(v8::String::NewSymbol("send"),
                                v8::FunctionTemplate::New(Send)->GetFunction());

  v8::Persistent<v8::Function> constructor = v8::Persistent<v8::Function>::New(tpl->GetFunction());
  exports->Set(v8::String::NewSymbol("Component"), constructor);
}

v8::Handle<v8::Value> JavaScriptComponent::New(const v8::Arguments& args) {
  v8::HandleScope scope;
  JavaScriptComponent* obj = new JavaScriptComponent();
  obj->Wrap(args.This());
  return args.This();
}

void JavaScriptComponent::process(Packet in, int port) {
    // call the JavaScript callback
    const int argc = 2;
    v8::Local<v8::Value> argv[argc] = {
        v8::Local<v8::Value>::New(PacketToJsObject(in)),
        v8::Local<v8::Value>::New(v8::Number::New(port)),
    };
    onProcess->Call(v8::Context::GetCurrent()->Global(), argc, argv);
}

v8::Handle<v8::Value> JavaScriptComponent::On(const v8::Arguments& args) {
  v8::HandleScope scope;

  JavaScriptComponent* obj = node::ObjectWrap::Unwrap<JavaScriptComponent>(args.This());
  v8::String::Utf8Value event(args[0]);
  if (*event == std::string("process")) {
      v8::Persistent<v8::Function> cb = v8::Persistent<v8::Function>::New(v8::Local<v8::Function>::Cast(args[1]));
      obj->onProcess = cb;
  }
  return scope.Close(v8::Undefined());
}

v8::Handle<v8::Value> JavaScriptComponent::Send(const v8::Arguments& args) {
  v8::HandleScope scope;

  JavaScriptComponent* obj = node::ObjectWrap::Unwrap<JavaScriptComponent>(args.This());
  Packet p = JsValueToPacket(args[1]);
  const int portId = args[1]->Int32Value();
  obj->send(p, portId);

  return scope.Close(v8::Undefined());
}

// Network
class JavaScriptNetwork : public Network, public node::ObjectWrap {
public:
    static void Init(v8::Handle<v8::Object> exports);

private:
    JavaScriptNetwork();
    ~JavaScriptNetwork();

    static v8::Handle<v8::Value> New(const v8::Arguments& args);
    static v8::Handle<v8::Value> AddNode(const v8::Arguments& args);
    static v8::Handle<v8::Value> Connect(const v8::Arguments& args);
    static v8::Handle<v8::Value> SendMessage(const v8::Arguments& args);
    static v8::Handle<v8::Value> Start(const v8::Arguments& args);
    static v8::Handle<v8::Value> RunTick(const v8::Arguments& args);
private:
    ;
};

JavaScriptNetwork::JavaScriptNetwork()
    : Network(new HostIO)
{
}

JavaScriptNetwork::~JavaScriptNetwork()
{}

void JavaScriptNetwork::Init(v8::Handle<v8::Object> exports) {
  // Prepare constructor template
  v8::Local<v8::FunctionTemplate> tpl = v8::FunctionTemplate::New(New);
  tpl->SetClassName(v8::String::NewSymbol("Network"));
  tpl->InstanceTemplate()->SetInternalFieldCount(3);
  // Prototype
  tpl->PrototypeTemplate()->Set(v8::String::NewSymbol("addNode"),
                                v8::FunctionTemplate::New(AddNode)->GetFunction());
  tpl->PrototypeTemplate()->Set(v8::String::NewSymbol("connect"),
                                v8::FunctionTemplate::New(Connect)->GetFunction());
  tpl->PrototypeTemplate()->Set(v8::String::NewSymbol("sendMessage"),
                                v8::FunctionTemplate::New(SendMessage)->GetFunction());
  tpl->PrototypeTemplate()->Set(v8::String::NewSymbol("start"),
                                v8::FunctionTemplate::New(Start)->GetFunction());
  tpl->PrototypeTemplate()->Set(v8::String::NewSymbol("runTick"),
                                v8::FunctionTemplate::New(RunTick)->GetFunction());

  v8::Persistent<v8::Function> constructor = v8::Persistent<v8::Function>::New(tpl->GetFunction());
  exports->Set(v8::String::NewSymbol("Network"), constructor);
}

v8::Handle<v8::Value> JavaScriptNetwork::New(const v8::Arguments& args) {
  v8::HandleScope scope;
  JavaScriptNetwork* obj = new JavaScriptNetwork();
  obj->Wrap(args.This());
  return args.This();
}

v8::Handle<v8::Value> JavaScriptNetwork::RunTick(const v8::Arguments& args) {
  v8::HandleScope scope;
  JavaScriptNetwork* obj = node::ObjectWrap::Unwrap<JavaScriptNetwork>(args.This());
  obj->runTick();
  return scope.Close(v8::Undefined());
}
v8::Handle<v8::Value> JavaScriptNetwork::Start(const v8::Arguments& args) {
  v8::HandleScope scope;
  JavaScriptNetwork* obj = node::ObjectWrap::Unwrap<JavaScriptNetwork>(args.This());
  obj->start();
  return scope.Close(v8::Undefined());
}

v8::Handle<v8::Value> JavaScriptNetwork::AddNode(const v8::Arguments& args) {
  v8::HandleScope scope;

  JavaScriptNetwork* network = node::ObjectWrap::Unwrap<JavaScriptNetwork>(args.This());
  Component *component = 0;
  if (args[0]->IsObject()) {
      component = node::ObjectWrap::Unwrap<JavaScriptComponent>(args[0]->ToObject());
  } else {
      component = Component::create((ComponentId)args[0]->Int32Value());
  }
  const int nodeId = network->addNode(component);

  return scope.Close(v8::Number::New(nodeId));
}

v8::Handle<v8::Value> JavaScriptNetwork::Connect(const v8::Arguments& args) {
  v8::HandleScope scope;

  JavaScriptNetwork* obj = node::ObjectWrap::Unwrap<JavaScriptNetwork>(args.This());
  const int srcNode = args[0]->Int32Value();
  const int srcPort = args[1]->Int32Value();
  const int targetNode = args[2]->Int32Value();
  const int targetPort = args[3]->Int32Value();
  obj->connect(srcNode, srcPort, targetNode, targetPort);

  return scope.Close(v8::Undefined());
}

v8::Handle<v8::Value> JavaScriptNetwork::SendMessage(const v8::Arguments& args) {
  v8::HandleScope scope;

  JavaScriptNetwork* obj = node::ObjectWrap::Unwrap<JavaScriptNetwork>(args.This());
  obj->sendMessage(args[0]->Int32Value(), args[1]->Int32Value(), JsValueToPacket(args[2]));

  return scope.Close(v8::Undefined());
}


// GraphStreamer
class JavaScriptGraphStreamer : public node::ObjectWrap, public GraphStreamer {
public:
    static void Init(v8::Handle<v8::Object> exports);

private:
    static v8::Handle<v8::Value> New(const v8::Arguments& args);
    static v8::Handle<v8::Value> ParseByte(const v8::Arguments& args);
private:
    ;
};

void JavaScriptGraphStreamer::Init(v8::Handle<v8::Object> exports) {
  v8::Local<v8::FunctionTemplate> tpl = v8::FunctionTemplate::New(New);
  tpl->SetClassName(v8::String::NewSymbol("GraphStreamer"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  tpl->PrototypeTemplate()->Set(v8::String::NewSymbol("parseByte"),
                                v8::FunctionTemplate::New(ParseByte)->GetFunction());

  v8::Persistent<v8::Function> constructor = v8::Persistent<v8::Function>::New(tpl->GetFunction());
  exports->Set(v8::String::NewSymbol("GraphStreamer"), constructor);
}

v8::Handle<v8::Value> JavaScriptGraphStreamer::New(const v8::Arguments& args) {
  v8::HandleScope scope;
  JavaScriptGraphStreamer* obj = new JavaScriptGraphStreamer();
  JavaScriptNetwork *net = node::ObjectWrap::Unwrap<JavaScriptNetwork>(args[0]->ToObject());
  obj->setNetwork(net);
  obj->Wrap(args.This());
  return args.This();
}

v8::Handle<v8::Value> JavaScriptGraphStreamer::ParseByte(const v8::Arguments& args) {
  v8::HandleScope scope;
  JavaScriptGraphStreamer* obj = node::ObjectWrap::Unwrap<JavaScriptGraphStreamer>(args.This());
  const char b = args[0]->Uint32Value();
  obj->parseByte(b);
  return scope.Close(v8::Undefined());
}

void init(v8::Handle<v8::Object> exports) {
  JavaScriptComponent::Init(exports);
  JavaScriptNetwork::Init(exports);
  JavaScriptGraphStreamer::Init(exports);
}

NODE_MODULE(MicroFloCc, init)
