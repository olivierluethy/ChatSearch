# google_ai


And then the response should be classified as role="ai" and then marked accordingly in renderChatMessage on the left side with an AI SVG so that it is clear and obvious to the user that this response comes from the AI. In addition, make sure that while the API query is being sent and a response is still being awaited, the user sees that the AI is responding, so that a bubble appears with a dotted tip animation, so that when you see it, you would think it was writing something. Do you understand what I mean?




Currently, when I confirm something with Enter via the input field with the ID “custom-ai-input,” it is stored correctly in the corresponding storage.

What is currently the case and should change is that when the website reloads, i.e., is reloaded, the content of:
document.querySelector(“textarea”)

is transferred to the input field “custom-ai-input.” I could then theoretically confirm it with Enter and it would be stored correctly.

However, I want the input field with the ID “custom-ai-input” to have the same textual content as the text area after the page has reloaded. In this case, the input in “custom-ai-input” should be sent directly, i.e., stored in the Chrome storage local value.



Und dann soll die Response als „role="ai”” unterstuft und im „renderChatMessage” entsprechend auf der linken Seite mit einem „AI SVG” versehen markiert werden, sodass für den Benutzer klar ersichtlich ist, dass diese Antwort von der KI kommt. Zusätzlich sollte während der API-Abfrage und während der Wartezeit auf eine Antwort eine Benachrichtigung angezeigt werden, sodass der Benutzer sieht, dass die KI gerade etwas schreibt. Verstehst du, was ich meine?



Bitte sage mir wo ich was genau ändern muss, damit ich zwischen dem Create Threads und Talk to ChatGPT bereich, so sich eine Trennlinie befindet, eine art resize lini habe, sodass ich mit der Maus den Bereich entweder grösser oder kleiner machen kann und dieser Wert sollte dann im localStorage gespeichert werden. Verstehst du was ich meine?



Currently, all Google searches are directed to the custom AI input field. The same applies when users search using the top search bar. Every search is sent to the 'custom-ai-input' field. The goal is for these inputs to be automatically saved in the chrome.storage.local variable. However, the 'custom-ai-input' field should only validate when I press the Enter key on my keyboard, not when I enter text. When the value is dropped by the Google search and lands in the input field, autosubmit is triggered. If a user enters something into the 'custom-ai-input' field, it should not validate automatically with each input; it should only validate when the user presses the Enter key.

However, it should not save to chrome.storage.local every time I enter something into the Google search without actually pressing Enter to submit it. It should only do so when I click Enter. It should only save to chrome.storage.local when I click on Enter.


Probleme vor allem mit der API:
Ich habe bei mir lokal auf dem Rechner einen PHP server am laufen mittels:
Documents/Google_AI_API$ php -S localhost:8000

Und in diesem index.php file steht folgendes:
<?php
require 'vendor/autoload.php';

use Dotenv\Dotenv;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

// Lade .env-Datei
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// OpenAI API-Schlüssel
$openaiApiKey = $_ENV['OPENAI_API_KEY'];

// Erstelle Guzzle Client
$client = new Client([
    'base_uri' => 'https://api.openai.com/v1/',
    'headers' => [
        'Authorization' => 'Bearer ' . $openaiApiKey,
        'Content-Type' => 'application/json',
    ],
]);

// CORS-Header setzen
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Ersetze * in Produktion mit deiner Chrome-Extension-Origin
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// API-Endpunkt für POST /api/chat
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_SERVER['REQUEST_URI'] === '/api/chat') {
    try {
        // JSON-Eingabe lesen
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['messages'])) {
            throw new Exception('Ungültige Eingabe: messages erforderlich');
        }

        // Standardmodell setzen, falls nicht angegeben
        $model = isset($input['model']) ? $input['model'] : 'gpt-3.5-turbo';

        // Sende Anfrage an OpenAI
        $response = $client->post('chat/completions', [
            'json' => [
                'model' => $model,
                'messages' => $input['messages'],
            ],
        ]);

        // Antwort verarbeiten
        $data = json_decode($response->getBody(), true);
        echo json_encode(['response' => $data['choices'][0]['message']['content']]);
    } catch (RequestException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpunkt nicht gefunden']);
}

Der lokale Server wird korrekt gestartet:
[Fri Oct 17 16:30:08 2025] PHP 8.3.6 Development Server (http://localhost:8000) started

Ich kann über meine chromium basierte Browsererweiterung im content.js mittels aufruf der sendToApi die lokale API abfragen und ich kriege einen Response:
 async function sendToApi(text) {
    const payload = {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: text }],
    };
    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok)
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.response || "Keine Antwort erhalten.";
    } catch (error) {
      console.error("API Error:", error);
      return `Error: ${error.message}`;
    }
  }


Nun ist aber das Ziel, dass diese API nicht mehr lokal bei mir läuft, sondern über ai.prompt-in.com, damit ich sie bei meinem Hoster bei cPanel Hosteurope laufen lassen kann.

Das Ziel ist dann, dass ich von meiner Erweiterung her auf diese API zugreifen kann:
async function sendToApi(text) {
    const payload = {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: text }],
    };
    try {
      const res = await fetch("https://ai.prompt-in.com/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok)
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.response || "Keine Antwort erhalten.";
    } catch (error) {
      console.error("API Error:", error);
      return `Error: ${error.message}`;
    }
  }

Und ich dann von ihr die selbe Antwort kriege wie beim lokalen Server. 

Beim server vom hoster habe ich unter public_html -> ai.prompt-in.com alle Dateien aus meinem lokalen Rechner zum hoster hochgeladen. Im index.php steht dann dem entsprechend ebenfalls das drin:

<?php
require 'vendor/autoload.php';

use Dotenv\Dotenv;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

// Lade .env-Datei
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// OpenAI API-Schlüssel
$openaiApiKey = $_ENV['OPENAI_API_KEY'];

// Erstelle Guzzle Client
$client = new Client([
    'base_uri' => 'https://api.openai.com/v1/',
    'headers' => [
        'Authorization' => 'Bearer ' . $openaiApiKey,
        'Content-Type' => 'application/json',
    ],
]);

// CORS-Header setzen
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Ersetze * in Produktion mit deiner Chrome-Extension-Origin
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// API-Endpunkt für POST /api/chat
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_SERVER['REQUEST_URI'] === '/api/chat') {
    try {
        // JSON-Eingabe lesen
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['messages'])) {
            throw new Exception('Ungültige Eingabe: messages erforderlich');
        }

        // Standardmodell setzen, falls nicht angegeben
        $model = isset($input['model']) ? $input['model'] : 'gpt-3.5-turbo';

        // Sende Anfrage an OpenAI
        $response = $client->post('chat/completions', [
            'json' => [
                'model' => $model,
                'messages' => $input['messages'],
            ],
        ]);

        // Antwort verarbeiten
        $data = json_decode($response->getBody(), true);
        echo json_encode(['response' => $data['choices'][0]['message']['content']]);
    } catch (RequestException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpunkt nicht gefunden']);
}

Im manifest.json habe ich es nun auf das umgestellt:
"host_permissions": [
    "https://ai.prompt-in.com/*"
  ],

Und der Aufruf erfolgt über die neue URL:
async function sendToApi(text) {
    const payload = {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: text }],
    };
    try {
      const res = await fetch("https://ai.prompt-in.com/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok)
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.response || "Keine Antwort erhalten.";
    } catch (error) {
      console.error("API Error:", error);
      return `Error: ${error.message}`;
    }
  }


Nur leider, wenn ich das über meinen Hoster mache, erhalte ich immer folgenden Fehler:

search?q=what+is+actually+obsidian&sca_esv=e54914a596765dca&ei=DQLyaO_jDeeE9u8PvOfi0QY&ved=0ahUKEwi…:1 Access to fetch at 'https://ai.prompt-in.com/api/chat' from origin 'https://www.google.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
content.js:989  POST https://ai.prompt-in.com/api/chat net::ERR_FAILED
sendToApi @ content.js:989
(anonymous) @ content.js:947
content.js:1003 API Error: TypeError: Failed to fetch
    at sendToApi (content.js:989:25)
    at content.js:947:17


Ich finde es persönlich sehr verwerflich, dass es lokal einfach schnell und sauber geht, und jetzt durch die Umstellung zu meinem Hoster gibt es plötzlich ständig probleme.

Kannst du mir bitte konkret sagen, was das Problem ist, wie ich das Lösen kann und warum es dann plötzlich funktionieren sollte.

- Der bewegende Punk: Lokal benutzt du den eingebauten PHP-Entwicklungsserver
- Beim Hoster läuft dein Code hinter einem richtigen Webserver (Apache)
Und diese beiden verhalten sich unterschiedlich.

Wenn du lokal startest mit:
- php -S localhost:8000
dann nutzt du den eingebauten PHP Development Server.
Der ist super simpel:
- Jede Anfrage zB. http://localhost:8000/api/chat landet automatisch bei deiner index.php (wenn du keinen echten api/chat-Ordner hast).
- PHP bekommt also sofort die Anfrage in $_SERVER['REQUEST_URI'] und kann sie verarbeiten
- Kein Apache, kein Nginx, kein Rewrite nötig.
- Das Verhalten ist: "Wenn keine Datei gefunden -> index.php ausführen."
Deshalb funktioniert dein Ednpunk /api/chat lokal sofort, ohne .htaccess, ohne echten Ordner.

Was beim Hoster (Apache) passiert:
- Wenn jemand https://ai.prompt-in.com/api/chat aufruft,
-> schaut Apache zuerst nach:
public_html/api/chat -> gibt's den Ordner?
- Wenn nein, schaut Apache:
Gibt es eine Datei api/chat?
Wenn nein, dann,
404 Not Found
Apache liefert die Fehlerseite - PHP bekommt gar nichts zu sehen!

PHP kommt hier also gar nicht zum Zug, wenn es keine Anweisung gibt, was mit unbekannten URLs passieren soll.
Und genau da kommt .htaccess ins Spiel.

Was .htaccess macht
Mit einer .htaccess Datei sagst du Apache:
"Wenn jemand /api/chat aufruft, und kein physischer Ordner/Datei existisrt, leite die Anfrage trotzdem an index.php weiter"

Genau das erledigen diese Zeilen:
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.php [L,QSA]

Damit verhält sich dein Apache-Server wie der eingebaute PHP-Server lokal.

Ab diesem Punkt ist das Verhalten auf dem Server identisch mit lokal:
- /api/chat wird weitergereicht
- PHP verarbeitet die Anfrage
- deine API funktioniert wieder 

Warum die vorherigen .htaccess nicht funktioniert haben waren die doppelt gesetzten Header - und das killt CORS
Du hattest in deiner PHP-Datei bereits CORS-Header gesetzt:
header('Access-Control-Allow-Origin: *');
...

Gleichzeitig hast du in .htaccess mit Header always set dieselbe Header nochmal gesetzt:
Header always set Access-Control-Allow-Origin "*"

Resultat im Response Header:
Access-Control-Allow-Origin: *
Access-Control-Allow-Origin: *

Und genau das meldete der Browser:
"The 'Access-Control-Allow-Origin' header contains multiple values",", but only one is allowed."


Prompt:
Ich habe bei mir lokal auf dem Rechner einen PHP server am laufen mittels:
Documents/Google_AI_API$ php -S localhost:8000

Und in diesem index.php file steht folgendes:
<?php
require 'vendor/autoload.php';

use Dotenv\Dotenv;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

// Lade .env-Datei
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// OpenAI API-Schlüssel
$openaiApiKey = $_ENV['OPENAI_API_KEY'];

// Erstelle Guzzle Client
$client = new Client([
    'base_uri' => 'https://api.openai.com/v1/',
    'headers' => [
        'Authorization' => 'Bearer ' . $openaiApiKey,
        'Content-Type' => 'application/json',
    ],
]);

// CORS-Header setzen
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Ersetze * in Produktion mit deiner Chrome-Extension-Origin
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// API-Endpunkt für POST /api/chat
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_SERVER['REQUEST_URI'] === '/api/chat') {
    try {
        // JSON-Eingabe lesen
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['messages'])) {
            throw new Exception('Ungültige Eingabe: messages erforderlich');
        }

        // Standardmodell setzen, falls nicht angegeben
        $model = isset($input['model']) ? $input['model'] : 'gpt-3.5-turbo';

        // Sende Anfrage an OpenAI
        $response = $client->post('chat/completions', [
            'json' => [
                'model' => $model,
                'messages' => $input['messages'],
            ],
        ]);

        // Antwort verarbeiten
        $data = json_decode($response->getBody(), true);
        echo json_encode(['response' => $data['choices'][0]['message']['content']]);
    } catch (RequestException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpunkt nicht gefunden']);
}

Der lokale Server wird korrekt gestartet:
[Fri Oct 17 16:30:08 2025] PHP 8.3.6 Development Server (http://localhost:8000) started

Ich kann über meine chromium basierte Browsererweiterung im content.js mittels aufruf der sendToApi die lokale API abfragen und ich kriege einen Response:
 async function sendToApi(text) {
    const payload = {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: text }],
    };
    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok)
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.response || "Keine Antwort erhalten.";
    } catch (error) {
      console.error("API Error:", error);
      return `Error: ${error.message}`;
    }
  }


Nun ist aber das Ziel, dass diese API nicht mehr lokal bei mir läuft, sondern über ai.prompt-in.com, damit ich sie bei meinem Hoster bei cPanel Hosteurope laufen lassen kann.

Das Ziel ist dann, dass ich von meiner Erweiterung her auf diese API zugreifen kann:
async function sendToApi(text) {
    const payload = {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: text }],
    };
    try {
      const res = await fetch("https://ai.prompt-in.com/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok)
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.response || "Keine Antwort erhalten.";
    } catch (error) {
      console.error("API Error:", error);
      return `Error: ${error.message}`;
    }
  }

Und ich dann von ihr die selbe Antwort kriege wie beim lokalen Server. 

Beim server vom hoster habe ich unter public_html -> ai.prompt-in.com alle Dateien aus meinem lokalen Rechner zum hoster hochgeladen. Im index.php steht dann dem entsprechend ebenfalls das drin:

<?php
require 'vendor/autoload.php';

use Dotenv\Dotenv;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

// Lade .env-Datei
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// OpenAI API-Schlüssel
$openaiApiKey = $_ENV['OPENAI_API_KEY'];

// Erstelle Guzzle Client
$client = new Client([
    'base_uri' => 'https://api.openai.com/v1/',
    'headers' => [
        'Authorization' => 'Bearer ' . $openaiApiKey,
        'Content-Type' => 'application/json',
    ],
]);

// CORS-Header setzen
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Ersetze * in Produktion mit deiner Chrome-Extension-Origin
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// API-Endpunkt für POST /api/chat
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_SERVER['REQUEST_URI'] === '/api/chat') {
    try {
        // JSON-Eingabe lesen
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['messages'])) {
            throw new Exception('Ungültige Eingabe: messages erforderlich');
        }

        // Standardmodell setzen, falls nicht angegeben
        $model = isset($input['model']) ? $input['model'] : 'gpt-3.5-turbo';

        // Sende Anfrage an OpenAI
        $response = $client->post('chat/completions', [
            'json' => [
                'model' => $model,
                'messages' => $input['messages'],
            ],
        ]);

        // Antwort verarbeiten
        $data = json_decode($response->getBody(), true);
        echo json_encode(['response' => $data['choices'][0]['message']['content']]);
    } catch (RequestException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpunkt nicht gefunden']);
}

Im manifest.json habe ich es nun auf das umgestellt:
"host_permissions": [
    "https://ai.prompt-in.com/*"
  ],

Und der Aufruf erfolgt über die neue URL:
async function sendToApi(text) {
    const payload = {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: text }],
    };
    try {
      const res = await fetch("https://ai.prompt-in.com/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok)
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.response || "Keine Antwort erhalten.";
    } catch (error) {
      console.error("API Error:", error);
      return `Error: ${error.message}`;
    }
  }


Nur leider, wenn ich das über meinen Hoster mache, erhalte ich immer folgenden Fehler:

search?q=what+is+actually+obsidian&sca_esv=e54914a596765dca&ei=DQLyaO_jDeeE9u8PvOfi0QY&ved=0ahUKEwi…:1 Access to fetch at 'https://ai.prompt-in.com/api/chat' from origin 'https://www.google.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
content.js:989  POST https://ai.prompt-in.com/api/chat net::ERR_FAILED
sendToApi @ content.js:989
(anonymous) @ content.js:947
content.js:1003 API Error: TypeError: Failed to fetch
    at sendToApi (content.js:989:25)
    at content.js:947:17


Ich finde es persönlich sehr verwerflich, dass es lokal einfach schnell und sauber geht, und jetzt durch die Umstellung zu meinem Hoster gibt es plötzlich ständig probleme.

Kannst du mir bitte konkret sagen, was das Problem ist, wie ich das Lösen kann und warum es dann plötzlich funktionieren sollte.

- (Was ich noch hätte erwähnen müssen ist, dass die API Schnittstelle /api/chat keinen Ordner ist für die API, sondern nur eine API Schnittstelle ist, aber ohne Ordner. Und ich glaube, dass dies der entsprechende Punkt war warum so viele Anfragen bzw. Antworten in die völlig falsche Richtung sich herzogen. Das heisst, die Ausführliche Beschreibung mit möglichst ganz vielen beinhaltenden Deatails ist sehr wichtig. Schön alles ausführlich beschreiben.)