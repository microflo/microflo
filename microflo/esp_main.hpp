/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2017 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 */

#include "arduino.hpp"
#include "mqtt.hpp"

#include <WiFiClient.h>
#include <WiFiClientSecure.h>

#ifdef ARDUINO_ARCH_ESP8266
#include <ESP8266WiFi.h>
#else
#include <Wifi.h>
#endif

#include <PubSubClient.h>
#include <Msgflo.h>

void loadFromProgMem(HostCommunication *controller) {
        for (unsigned int i=0; i<sizeof(graph); i++) {
        unsigned char c = graph[i];
        controller->parseByte(c);
    }
}

class MqttMount : public HostCommunication {
public:
  std::vector<msgflo::OutPort *> outports;

public:
    MqttMount()
    {

    }

    virtual void packetSent(const Message &m, const Component *sender, MicroFlo::PortId senderPort) {

        const MicroFlo::NodeId senderId = sender->id();
        const std::string data = encodePacket(m.pkg);
        Serial.printf("sent %d %d: %s \n", senderId, senderPort, data.c_str());

        msgflo::OutPort *port = NULL;
        for (size_t i=0; i<graph_outports_length; i++) {
            const char *name = graph_outports_name[i];
            if (graph_outports_node[i] == senderId
                && graph_outports_port[i] == senderPort) {

                if (i < outports.size()) {
                  port = outports[i];
                }
                break;
            };
        }
        if (port) {
          port->send(String(data.c_str()));
        }

        // Chain to parent
        HostCommunication::packetSent(m, sender, senderPort);
    }

};

// Config defaults
#ifndef MICROFLO_ARDUINO_BAUDRATE
#define MICROFLO_ARDUINO_BAUDRATE 115200
#endif


// Default to no prefix
#ifndef MICROFLO_MQTT_PREFIX
#define MICROFLO_MQTT_PREFIX ""
#endif

// Default to no MQTT username/password
#ifndef MICROFLO_MQTT_USER
#define MICROFLO_MQTT_USER 0
#endif
#ifndef MICROFLO_MQTT_PASSWORD
#define MICROFLO_MQTT_PASSWORD 0
#endif

// Default to public mosquitto test server
#ifndef MICROFLO_MQTT_PORT
#define MICROFLO_MQTT_PORT 1883
#endif

#ifndef MICROFLO_MQTT_HOST
#define MICROFLO_MQTT_HOST  "test.mosquitto.org"
#endif


#ifndef MICROFLO_WIFI_SSID
#error "Missing wifi ssid. Define MICROFLO_WIFI_SSID"
#endif

#ifndef MICROFLO_WIFI_PASSWORD
#error "Missing wifi password. Define MICROFLO_WIFI_PASSWORD"
#endif

#ifndef MICROFLO_MSGFLO_ROLE
#define MICROFLO_MSGFLO_ROLE "unknown"
#endif

#ifndef MICROFLO_MSGFLO_COMPONENT
#define MICROFLO_MSGFLO_COMPONENT graph_name
#endif

// MicroFlo
ArduinoIO io;
const int serialPort = 0;
const int serialBaudrate = MICROFLO_ARDUINO_BAUDRATE;
FixedMessageQueue queue;
Network network(&io, &queue);
MqttMount controller;
SerialHostTransport transport(serialPort, serialBaudrate);

// MsgFlo
WiFiClient wifiClient;
PubSubClient mqttClient;
msgflo::Engine *engine;

const std::string ROLE = MICROFLO_MSGFLO_ROLE;

auto participant = msgflo::Participant(MICROFLO_MSGFLO_COMPONENT, ROLE.c_str());

void setup()
{
    // MicroFlo
    transport.setup(&io, &controller);
    controller.setup(&network, &transport);
#ifdef MICROFLO_EMBED_GRAPH
    loadFromProgMem(&controller);
#endif

  // WiFi
  WiFi.mode(WIFI_STA);
  Serial.printf("Configuring wifi: %s\r\n", MICROFLO_WIFI_SSID);
  WiFi.begin(MICROFLO_WIFI_SSID, MICROFLO_WIFI_PASSWORD);

  // MQTT
  mqttClient.setServer(MICROFLO_MQTT_HOST, MICROFLO_MQTT_PORT);
  mqttClient.setClient(wifiClient);
  String clientId = ROLE.c_str();
  clientId += WiFi.macAddress();

  const std::string prefix = MICROFLO_MQTT_PREFIX+ROLE+"/";

  // Msgflo
  engine = msgflo::pubsub::createPubSubClientEngine(participant, &mqttClient, clientId.c_str(), MICROFLO_MQTT_USER, MICROFLO_MQTT_PASSWORD);

  // Export ports
  // TODO: read from commandstream instead of graph_XX
  for (size_t i=0; i<graph_inports_length; i++) {
      const char *name = graph_inports_name[i];
      MicroFlo::PortId portId = graph_inports_port[i];
      MicroFlo::NodeId nodeId = graph_inports_node[i];
      auto callback = [nodeId, portId, name](byte *data, int length) -> void {
          const std::string in((char *)data, length);
          const Packet pkg = decodePacket(in);

          Serial.printf("received on %s on %s: %d %d:\n", in.c_str(), name, nodeId, portId);
          network.sendMessageTo(nodeId, portId, pkg);
      };

      engine->addInPort("in", "any", String((prefix+name).c_str()), callback);
  }

  std::vector<msgflo::OutPort *> outports;
  for (size_t i=0; i<graph_outports_length; i++) {
      const char *name = graph_outports_name[i];
      MicroFlo::PortId portId = graph_outports_port[i];
      MicroFlo::NodeId nodeId = graph_outports_node[i];
      auto p = engine->addOutPort(name, "any", String((prefix+name).c_str()));
      network.subscribeToPort(nodeId, portId, true);
      outports.push_back(p);
  }
  controller.outports = outports;
  // FIXME: send data from MicroFlo to outport

}

void loop()
{
  // MicroFlo
  transport.runTick();
  network.runTick();

  // Msgflo
  static bool connected = false;
  if (WiFi.status() == WL_CONNECTED) {
    if (!connected) {
      Serial.printf("Wifi connected: ip=%s\r\n", WiFi.localIP().toString().c_str());
    }
    connected = true;
    engine->loop();
  } else {
    if (connected) {
      connected = false;
      Serial.println("Lost wifi connection.");
    }
  }
}

#include "microflo.hpp"

