"""
HTTP wrapper around the multilingual chatbot model.

Lets the Node backend call the trained model over HTTP instead of spawning
a local Python process. Start with:  python server.py

Endpoints:
  GET  /health    -> {"status": "ok", "ready": true/false, "languages": [...]}
  POST /predict   -> {"response": "..."}
                     body: {"message": str, "language": str, "auto_detect": bool, "use_cache": bool}
"""

import json
import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCRIPTS_DIR = os.path.join(BASE_DIR, "scripts")
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

import chatbot_multilingual as cb

LANGUAGES = cb.LANGUAGES
_lock = threading.Lock()


class ModelRequestHandler(BaseHTTPRequestHandler):
    server_version = "NaujanChatbotModel/1.0"

    def _send_json(self, status, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.split("?")[0].rstrip("/") == "/health":
            return self._send_json(200, {"status": "ok", "ready": True, "languages": LANGUAGES})
        return self._send_json(404, {"error": "Not found"})

    def do_POST(self):
        if self.path.split("?")[0].rstrip("/") != "/predict":
            return self._send_json(404, {"error": "Not found"})

        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            data = json.loads(raw.decode("utf-8")) if raw else {}
        except Exception as exc:
            return self._send_json(400, {"error": f"Invalid JSON body: {exc}"})

        message = data.get("message")
        if not isinstance(message, str) or not message.strip():
            return self._send_json(400, {"error": "message is required"})

        payload = {
            "id": data.get("id"),
            "message": message.strip(),
            "language": data.get("language"),
            "auto_detect": bool(data.get("auto_detect", True)),
            "use_cache": bool(data.get("use_cache", True)),
        }

        try:
            with _lock:
                result = cb.handle_request(payload)
            response = result.get("response")
            if not response:
                response = cb.get_low_confidence_response(data.get("language") or "en")
            return self._send_json(200, {"response": response})
        except Exception as exc:
            print(f"Predict error: {exc}", file=sys.stderr)
            return self._send_json(500, {"error": "Prediction failed"})

    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))


def main():
    port = int(os.environ.get("PORT", "8000"))
    httpd = ThreadingHTTPServer(("0.0.0.0", port), ModelRequestHandler)
    httpd.daemon_threads = True
    print(f"Model server listening on port {port}", file=sys.stderr)
    httpd.serve_forever()


if __name__ == "__main__":
    main()