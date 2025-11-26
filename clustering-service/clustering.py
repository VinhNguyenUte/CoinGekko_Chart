from flask import Flask
app = Flask(__name__)

@app.get("/hello")
def hello():
    return "hi"

app.run(host="0.0.0.0", port=5004)
