// Set this to length of sample(in milliseconds)
const long maxIdleTime = 3*1000;

const int ledPin = 13;
const int pidPin = 12;
const int mp3Pin = 11;

long lastActiveTime = 0;
int mp3State = LOW;

void setup() {
  pinMode(ledPin, OUTPUT);
  pinMode(pidPin, INPUT);
  digitalWrite(pidPin, HIGH); // internal pullup ON
  pinMode(mp3Pin, OUTPUT); 
}

void loop()
{
  unsigned long currentMillis = millis();
 
  int currentState = !digitalRead(pidPin);
  if (currentState) {
       lastActiveTime = currentMillis;
       mp3State = HIGH;
  }

  if ((currentMillis-lastActiveTime) > maxIdleTime) {    
        if (mp3State && !currentState) {
            lastActiveTime = currentMillis;
            mp3State = LOW;
        }
  }

  digitalWrite(ledPin, mp3State);
  digitalWrite(mp3Pin, !mp3State);
}

