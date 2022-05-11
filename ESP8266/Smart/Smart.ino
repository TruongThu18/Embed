#include "DHT.h"
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include "ArduinoJson.h"
#include <Wire.h>
// Thông tin về wifi

//#define ssid "Full House"
//#define password "11111111"

//#define ssid "Kita"
//#define password "88881111"

#define ssid "Lime"
//#define ssid "NhaOngTinh_5G"
#define password "123456788"
#define mqtt_server "broker.hivemq.com"

const uint16_t mqtt_port = 1883; //Port của MQT

#define topic_list "docs"

#define DHTPIN D5
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);


WiFiClient espClient;
PubSubClient client(espClient);

void setup()
{
  Serial.begin(115200);
  Wire.begin();
  // Initialise serial communication
  setup_wifi();                             //thực hiện kết nối Wifi
  client.setServer(mqtt_server, mqtt_port); // cài đặt server và lắng nghe client ở port 1883
  client.setCallback(callback);
//  if (!client.connected())
//  { // Kiểm tra kết nối
//    reconnect();
//  }
    client.subscribe("gardenLight");

  pinMode(D0, OUTPUT); // light
  dht.begin();
}


void setup_wifi(){
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  // in ra thông báo đã kết nối và địa chỉ IP của ESP8266
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

// Hàm call back để nhận dữ liệu
void callback(char *topic, byte *payload, unsigned int length)
{
  //-----------------------------------------------------------------
  //in ra tên của topic và nội dung nhận được
  Serial.print("Co tin nhan moi tu topic: ");
  Serial.println(topic);
  char p[length + 1];
  memcpy(p, payload, length);
  p[length] = NULL;
  String message(p);
    if (String(topic) == "gardenLight"){
      if (message == "gardenLightOn"){
        digitalWrite(D0, HIGH);
      }
      if (message == "gardenLightOff"){
        digitalWrite(D0, LOW);
      }
    }
  


  Serial.println(message);
  Serial.write(payload, length);
  Serial.println();
  //-------------------------------------------------------------------------
}

// Hàm reconnect thực hiện kết nối lại khi mất kết nối với MQTT Broker
void reconnect(){
  while (!client.connected()) // Chờ tới khi kết nối
  {
      String clientId = "Kita-ESP8266";
    if (client.connect("Kita-ESP8266")) //kết nối vào broker
    {
      Serial.println("Đã kết nối:");
      //đăng kí nhận dữ liệu từ topic
    client.subscribe("gardenLight");
    }
    else{
      // in ra trạng thái của client khi không kết nối được với broker
      Serial.print("Lỗi:, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Đợi 5s
      delay(5000);
    }
  }
}

unsigned long lastMsg = 0;
void loop(){   
  if (!client.connected()){// Kiểm tra kết nối
      reconnect();
    }
     client.loop();
  long now = millis();
  if (now - lastMsg > 30000)   // thời gian gửi dữ liệu lên server
  {
    lastMsg = now;
    int h = dht.readHumidity();
    // Read temperature as Celsius (the default)
    int t = dht.readTemperature();
    // Read temperature as Fahrenheit (isFahrenheit = true)
    // Check if any reads failed and exit early (to try again).
    if (isnan(h) || isnan(t)){
      Serial.println(F("Failed to read from DHT sensor!"));
      return;
    } 
    char tempString[10];
    sprintf(tempString, "%d", t);
    char humiString[10];
    sprintf(humiString, "%d", h);

    StaticJsonDocument<100> doc;
    doc["Temperature"] = t;
    doc["Humidity"] = h;

    char buffer[256];
    serializeJson(doc, buffer);
    client.publish("topic", buffer);
    client.publish(topic_list, buffer);
    Serial.println(buffer);
  }
}
