from flask import Flask, render_template, send_from_directory
import os

app = Flask(__name__, 
            template_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'source'),
            static_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'source'))

@app.route('/')
def dashboard():
    return render_template('dashboard.html')

@app.route('/analysis')
def analysis():
    return render_template('analysis.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
