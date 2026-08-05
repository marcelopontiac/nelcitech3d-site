from flask import Flask, request, jsonify, session, send_from_directory, redirect, url_for
import sqlite3, os, hashlib, secrets, json
from functools import wraps
from datetime import datetime

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, 'finance.db')
os.makedirs(BASE_DIR, exist_ok=True)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT,
            description TEXT,
            category TEXT,
            type TEXT,
            amount REAL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS investments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ticker TEXT,
            name TEXT,
            category TEXT,
            quantity REAL,
            avg_price REAL,
            current_price REAL,
            purchase_date TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    ''')
    conn.commit()
    conn.close()

def hash_password(pw):
    salt = secrets.token_hex(16)
    h = hashlib.sha256((salt + pw).encode()).hexdigest()
    return f"{salt}:{h}"

def verify_password(pw, stored):
    salt, h = stored.split(':')
    return hashlib.sha256((salt + pw).encode()).hexdigest() == h

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Unauthorized'}), 401
            return redirect('/login.html')
        return f(*args, **kwargs)
    return decorated

# --- Static files ---
@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/demo.html')
@login_required
def demo():
    return send_from_directory(BASE_DIR, 'demo.html')

@app.route('/login.html')
def login_page():
    return send_from_directory(BASE_DIR, 'login.html')

@app.route('/register.html')
def register_page():
    return send_from_directory(BASE_DIR, 'register.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(BASE_DIR, filename)

# --- Auth API ---
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    if not name or not email or not password:
        return jsonify({'error': 'Preencha todos os campos'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Senha deve ter no minimo 6 caracteres'}), 400
    conn = get_db()
    try:
        conn.execute('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
                      (name, email, hash_password(password)))
        conn.commit()
        user = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
        session['user_id'] = user['id']
        session['user_name'] = name
        return jsonify({'ok': True, 'name': name})
    except sqlite3.IntegrityError:
        return jsonify({'error': 'E-mail ja cadastrado'}), 400
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()
    if user and verify_password(password, user['password_hash']):
        session['user_id'] = user['id']
        session['user_name'] = user['name']
        return jsonify({'ok': True, 'name': user['name']})
    return jsonify({'error': 'E-mail ou senha invalidos'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'ok': True})

@app.route('/api/me')
def me():
    if 'user_id' in session:
        return jsonify({'logged_in': True, 'name': session.get('user_name', '')})
    return jsonify({'logged_in': False})

# --- Transactions API ---
@app.route('/api/transactions', methods=['GET'])
@login_required
def get_transactions():
    conn = get_db()
    rows = conn.execute('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC',
                        (session['user_id'],)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/transactions', methods=['POST'])
@login_required
def add_transaction():
    data = request.json
    conn = get_db()
    conn.execute('INSERT INTO transactions (user_id, date, description, category, type, amount) VALUES (?, ?, ?, ?, ?, ?)',
                 (session['user_id'], data['date'], data['description'], data['category'], data['type'], data['amount']))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

@app.route('/api/transactions/<int:tid>', methods=['DELETE'])
@login_required
def delete_transaction(tid):
    conn = get_db()
    conn.execute('DELETE FROM transactions WHERE id = ? AND user_id = ?', (tid, session['user_id']))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

# --- Investments API ---
@app.route('/api/investments', methods=['GET'])
@login_required
def get_investments():
    conn = get_db()
    rows = conn.execute('SELECT * FROM investments WHERE user_id = ?',
                        (session['user_id'],)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/investments', methods=['POST'])
@login_required
def add_investment():
    data = request.json
    conn = get_db()
    conn.execute('INSERT INTO investments (user_id, ticker, name, category, quantity, avg_price, current_price, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                 (session['user_id'], data['ticker'], data['name'], data['category'],
                  data['quantity'], data['avg_price'], data['current_price'], data['purchase_date']))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

@app.route('/api/investments/<int:iid>', methods=['DELETE'])
@login_required
def delete_investment(iid):
    conn = get_db()
    conn.execute('DELETE FROM investments WHERE id = ? AND user_id = ?', (iid, session['user_id']))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

# --- Summary API ---
@app.route('/api/summary')
@login_required
def summary():
    uid = session['user_id']
    conn = get_db()
    txns = conn.execute('SELECT type, SUM(amount) as total FROM transactions WHERE user_id = ? GROUP BY type', (uid,)).fetchall()
    inv = conn.execute('SELECT SUM(quantity * avg_price) as invested, SUM(quantity * current_price) as current FROM investments WHERE user_id = ?', (uid,)).fetchone()
    count = conn.execute('SELECT COUNT(*) as c FROM transactions WHERE user_id = ?', (uid,)).fetchone()
    conn.close()

    income = sum(r['total'] for r in txns if r['type'] == 'income')
    expense = sum(r['total'] for r in txns if r['type'] == 'expense')
    balance = income - expense
    invested = inv['invested'] or 0
    current_val = inv['current'] or 0

    return jsonify({
        'balance': balance,
        'income': income,
        'expense': expense,
        'transactions_count': count['c'],
        'invested': invested,
        'current_value': current_val,
        'profit': current_val - invested
    })

init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
