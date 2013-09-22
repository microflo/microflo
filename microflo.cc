#include <node.h>
#include <v8.h>

#define HOST_BUILD
#define MICROFLO_NO_MAIN
#include "microflo/microflo.hpp"

using namespace v8;

Handle<Value> Method(const Arguments& args) {
  HandleScope scope;
  return scope.Close(String::New("world"));
}

void init(Handle<Object> exports) {
  exports->Set(String::NewSymbol("hello"),
      FunctionTemplate::New(Method)->GetFunction());
}

NODE_MODULE(MicroFlo, init)
