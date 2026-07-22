#!/usr/bin/env python3
import http.server
import os
import json
import secrets
import hashlib
import time
import urllib.parse
import urllib.request

BRAPI_TOKEN = 'esj5oUr5FrcdbcumYwV9wJ'

DIR = '/home/marcelotech/nelcitech3d-site'
VERSION_FILE = os.path.join(DIR, 'version.json')
LICENSES_FILE = os.path.join(DIR, 'licenses.json')
SESSIONS_FILE = os.path.join(DIR, 'sessions.json')
USERS_FILE = os.path.join(DIR, 'users.json')
VISITS_FILE = os.path.join(DIR, 'visits.json')
DATA_DIR = os.path.join(DIR, 'userdata')
os.makedirs(DATA_DIR, exist_ok=True)

ADMIN_EMAIL = 'admin@nelcitech3d.com.br'
ADMIN_PASS_HASH = hashlib.sha256('N3lC1T3d@2026'.encode()).hexdigest()

def load_json(path, default=None):
    if default is None:
        default = {}
    try:
        with open(path) as f:
            return json.load(f)
    except:
        return default

def save_json(path, data):
    with open(path, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def parse_body(handler):
    body = handler.rfile.read(int(handler.headers.get('Content-Length', 0)))
    ct = handler.headers.get('Content-Type', '')
    if 'application/json' in ct:
        return json.loads(body)
    else:
        parsed = urllib.parse.parse_qsl(body.decode('utf-8'))
        return dict(parsed)

def get_session_user(headers):
    token = None
    auth = headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        token = auth[7:].strip()
    if not token:
        cookie = headers.get('Cookie', '')
        for c in cookie.split(';'):
            c = c.strip()
            if c.startswith('session='):
                token = c.split('=', 1)[1]
                break
    if token:
        sessions = load_json(SESSIONS_FILE, {})
        if token in sessions:
            return sessions[token]
    return None

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Cloudflare-CDN-Cache-Control', 'no-store')
        self.send_header('Surrogate-Control', 'no-store')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def send_redirect(self, url):
        self.send_response(302)
        self.send_header('Location', url)
        self.end_headers()

    def read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        return self.rfile.read(length).decode() if length else '{}'

    def do_GET(self):
        path = self.path.split('?')[0]

        if path == '/demo.html' or path == '/dashboard.html' or path == '/admin.html' or path == '/v2.html':
            self.send_redirect('/nelci.html')
            return

        if path == '/api/version':
            self.send_json(load_json(VERSION_FILE, {'current_version':'0.0.0','updates':[]}))
            return

        if path.startswith('/api/stocks/'):
            user = get_session_user(self.headers)
            if not user:
                self.send_json({'error':'Unauthorized'}, 401)
                return
            tickers = path.split('/api/stocks/')[1]
            if not tickers:
                self.send_json({'error':'No tickers'}, 400)
                return
            try:
                url = f'https://brapi.dev/api/quote/{tickers}?token={BRAPI_TOKEN}'
                req = urllib.request.Request(url)
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = json.loads(resp.read().decode())
                self.send_json(data)
            except Exception as e:
                self.send_json({'error': str(e)}, 500)
            return

        if path == '/api/forex/usdbrl':
            user = get_session_user(self.headers)
            if not user:
                self.send_json({'error':'Unauthorized'}, 401)
                return
            try:
                url = 'https://open.er-api.com/v6/latest/USD'
                req = urllib.request.Request(url)
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = json.loads(resp.read().decode())
                rate = data.get('rates', {}).get('BRL', 5.7)
                self.send_json({'rate': rate})
            except Exception as e:
                self.send_json({'rate': 5.7, 'error': str(e)})
            return

        if path == '/api/licenses':
            user = get_session_user(self.headers)
            if not user or not user.get('is_admin'):
                self.send_json({'error':'Unauthorized'}, 401)
                return
            self.send_json(load_json(LICENSES_FILE, {'codes':[]}))
            return

        if path == '/api/users':
            user = get_session_user(self.headers)
            if not user or not user.get('is_admin'):
                self.send_json({'error':'Unauthorized'}, 401)
                return
            users = load_json(USERS_FILE, {'users':[]})
            safe = []
            for u in users.get('users', []):
                safe.append({'name':u.get('name',''),'email':u.get('email',''),'premium':u.get('premium',False),'license':u.get('license',''),'created':u.get('created','')})
            self.send_json({'users': safe})
            return

        if path == '/api/me':
            user = get_session_user(self.headers)
            if user:
                expire = user.get('expire_at', '')
                expired = False
                is_admin = user.get('is_admin', False)
                if expire and not is_admin:
                    try:
                        exp_date = time.mktime(time.strptime(expire, '%Y-%m-%d'))
                        expired = time.time() > exp_date
                    except: pass
                self.send_json({'logged_in': True, 'name': user.get('name',''), 'email': user.get('email',''), 'premium': user.get('premium', False), 'is_admin': is_admin, 'expire_at': expire, 'expired': expired})
            else:
                self.send_json({'logged_in': False})
            return

        if path == '/api/visits':
            visits = load_json(VISITS_FILE, {'count': 0})
            self.send_json({'count': visits.get('count', 0)})
            return
            return

        if path == '/api/data':
            user = get_session_user(self.headers)
            if not user:
                self.send_json({'error': 'Unauthorized'}, 401)
                return
            uf = os.path.join(DATA_DIR, user['email'].replace('@','_at_') + '.json')
            self.send_json(load_json(uf, {'transactions':[],'investments':[],'suppliers':[],'purchases':[],'sales':[]}))
            return

        super().do_GET()

    def do_POST(self):
        global ADMIN_PASS_HASH
        path = self.path.split('?')[0]

        if path == '/api/visit':
            visits = load_json(VISITS_FILE, {'count': 0})
            visits['count'] = visits.get('count', 0) + 1
            save_json(VISITS_FILE, visits)
            self.send_json({'count': visits['count']})
            return

        if path == '/api/login':
            data = parse_body(self)
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')

            if email == ADMIN_EMAIL:
                if hashlib.sha256(password.encode()).hexdigest() == ADMIN_PASS_HASH:
                    token = secrets.token_hex(32)
                    sessions = load_json(SESSIONS_FILE, {})
                    sessions[token] = {'name': 'Admin NELCi', 'email': email, 'is_admin': True, 'premium': True, 'expire_at': '2099-12-31'}
                    save_json(SESSIONS_FILE, sessions)
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Set-Cookie', 'session=' + token + '; Path=/; SameSite=Lax')
                    self.end_headers()
                    self.wfile.write(json.dumps({'ok': True, 'redirect': '/nelci.html', 'token': token}).encode())
                    return

            users = load_json(USERS_FILE, {'users': []})
            for u in users.get('users', []):
                if u.get('email') == email:
                    if u.get('password_hash') == hashlib.sha256(password.encode()).hexdigest():
                        token = secrets.token_hex(32)
                        sessions = load_json(SESSIONS_FILE, {})
                        sessions[token] = {'name': u.get('name',''), 'email': email, 'premium': u.get('premium', False), 'is_admin': False}
                        save_json(SESSIONS_FILE, sessions)
                        self.send_response(200)
                        self.send_header('Content-Type', 'application/json')
                        self.send_header('Set-Cookie', 'session=' + token + '; Path=/; SameSite=Lax')
                        self.end_headers()
                        self.wfile.write(json.dumps({'ok': True, 'redirect': '/nelci.html', 'token': token}).encode())
                        return
                    break

            self.send_json({'error': 'E-mail ou senha invalidos'}, 401)
            return

        if path == '/api/register':
            data = parse_body(self)
            name = data.get('name', '').strip()
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')
            if not name or not email or not password:
                self.send_json({'error': 'Preencha todos os campos'}, 400)
                return
            if email == ADMIN_EMAIL.lower():
                self.send_json({'error': 'Este email nao pode ser cadastrado'}, 400)
                return
            users = load_json(USERS_FILE, {'users': []})
            for u in users.get('users', []):
                if u.get('email') == email:
                    self.send_json({'error': 'E-mail ja cadastrado'}, 400)
                    return
            users['users'].append({
                'name': name,
                'email': email,
                'password_hash': hashlib.sha256(password.encode()).hexdigest(),
                'premium': False,
                'license': '',
                'created': time.strftime('%Y-%m-%d %H:%M:%S')
            })
            save_json(USERS_FILE, users)
            token = secrets.token_hex(32)
            sessions = load_json(SESSIONS_FILE, {})
            sessions[token] = {'name': name, 'email': email, 'premium': False, 'is_admin': False}
            save_json(SESSIONS_FILE, sessions)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Set-Cookie', 'session=' + token + '; Path=/; SameSite=Lax')
            self.end_headers()
            self.wfile.write(json.dumps({'ok': True, 'redirect': '/nelci.html', 'token': token}).encode())
            return

        if path == '/api/logout':
            cookie = self.headers.get('Cookie', '')
            for c in cookie.split(';'):
                c = c.strip()
                if c.startswith('session='):
                    token = c.split('=', 1)[1]
                    sessions = load_json(SESSIONS_FILE, {})
                    sessions.pop(token, None)
                    save_json(SESSIONS_FILE, sessions)
            self.send_response(302)
            self.send_header('Set-Cookie', 'session=; Path=/; Max-Age=0')
            self.send_header('Location', '/login.html')
            self.end_headers()
            return

        if path == '/api/change-password':
            user = get_session_user(self.headers)
            if not user:
                self.send_json({'error': 'Unauthorized'}, 401)
                return
            data = parse_body(self)
            current_password = data.get('currentPassword', '')
            new_password = data.get('newPassword', '')
            if not new_password or len(new_password) < 6:
                self.send_json({'error': 'Nova senha deve ter no minimo 6 caracteres'}, 400)
                return
            email = user.get('email', '')
            if email == ADMIN_EMAIL:
                if hashlib.sha256(current_password.encode()).hexdigest() != ADMIN_PASS_HASH:
                    self.send_json({'error': 'Senha atual incorreta'}, 400)
                    return
                ADMIN_PASS_HASH = hashlib.sha256(new_password.encode()).hexdigest()
                self.send_json({'ok': True, 'message': 'Senha alterada com sucesso!'})
                return
            users = load_json(USERS_FILE, {'users': []})
            found = False
            for u in users.get('users', []):
                if u.get('email') == email:
                    if u.get('password_hash') != hashlib.sha256(current_password.encode()).hexdigest():
                        self.send_json({'error': 'Senha atual incorreta'}, 400)
                        return
                    u['password_hash'] = hashlib.sha256(new_password.encode()).hexdigest()
                    found = True
                    break
            if not found:
                self.send_json({'error': 'Usuario nao encontrado'}, 404)
                return
            save_json(USERS_FILE, users)
            self.send_json({'ok': True, 'message': 'Senha alterada com sucesso!'})
            return

        if path == '/api/ai/save-key':
            user = get_session_user(self.headers)
            if not user or not user.get('is_admin'):
                self.send_json({'error': 'Unauthorized'}, 401)
                return
            data = parse_body(self)
            api_key = data.get('apiKey', '')
            settings = load_json(os.path.join(DIR, 'settings.json'), {})
            settings['deepseek_api_key'] = api_key
            save_json(os.path.join(DIR, 'settings.json'), settings)
            self.send_json({'ok': True})
            return

        if path == '/api/ai/get-key':
            user = get_session_user(self.headers)
            if not user or not user.get('is_admin'):
                self.send_json({'error': 'Unauthorized'}, 401)
                return
            settings = load_json(os.path.join(DIR, 'settings.json'), {})
            api_key = settings.get('deepseek_api_key', '')
            if api_key:
                self.send_json({'hasKey': True, 'masked': api_key[:6]+'...'+api_key[-4:]})
            else:
                self.send_json({'hasKey': False, 'masked': ''})
            return

        if path == '/api/ai/chat':
            user = get_session_user(self.headers)
            if not user or not user.get('is_admin'):
                self.send_json({'error': 'Unauthorized'}, 401)
                return
            settings = load_json(os.path.join(DIR, 'settings.json'), {})
            api_key = settings.get('deepseek_api_key', '')
            if not api_key:
                self.send_json({'error': 'Configure a API key do DeepSeek em Opcoes > Assistente IA'})
                return
            data = parse_body(self)
            messages = data.get('messages', [])
            email = user.get('email', '')
            user_dir = os.path.join(DIR, 'users', email.replace('@','_at_'))
            transactions = load_json(os.path.join(user_dir, 'transactions.json'), {'transactions': []})
            investments = load_json(os.path.join(user_dir, 'investments.json'), {'investments': []})
            suppliers = load_json(os.path.join(user_dir, 'suppliers.json'), {'suppliers': []})
            purchases = load_json(os.path.join(user_dir, 'purchases.json'), {'purchases': []})
            sales = load_json(os.path.join(user_dir, 'sales.json'), {'sales': []})
            txns = transactions.get('transactions', [])[:15]
            invs = investments.get('investments', [])[:10]
            sups = suppliers.get('suppliers', [])[:10]
            prchs = purchases.get('purchases', [])[:10]
            sls = sales.get('sales', [])[:10]
            receitas = sum(float(t.get('amount', 0)) for t in txns if t.get('type') == 'income')
            despesas = sum(float(t.get('amount', 0)) for t in txns if t.get('type') == 'expense')
            context = (
                "Voce e o assistente financeiro do app NELCi Tech 3D. Responda em portugues, seja direto e util.\n"
                "Dados financeiros do usuario (ultimos registros):\n"
                f"- Transacoes: {json.dumps(txns)}\n"
                f"- Investimentos: {json.dumps(invs)}\n"
                f"- Fornecedores: {json.dumps(sups)}\n"
                f"- Compras: {json.dumps(prchs)}\n"
                f"- Vendas: {json.dumps(sls)}\n"
                f"Resumo: Receitas R${receitas:.2f} | Despesas R${despesas:.2f} | Lucro R${receitas-despesas:.2f}"
            )
            api_messages = [{'role': 'system', 'content': context}] + messages
            import urllib.request as urlreq
            body = json.dumps({
                'model': 'deepseek-v4-flash',
                'messages': api_messages,
                'max_tokens': 1500,
                'stream': False
            }).encode()
            req = urlreq.Request(
                'https://api.deepseek.com/chat/completions',
                data=body,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + api_key
                }
            )
            try:
                with urlreq.urlopen(req, timeout=60) as resp:
                    result = json.loads(resp.read().decode())
                    if result.get('choices') and result['choices'][0]:
                        self.send_json({'ok': True, 'reply': result['choices'][0]['message']['content']})
                    else:
                        self.send_json({'error': 'Resposta vazia da API'})
            except Exception as e:
                self.send_json({'error': 'Erro de conexao: ' + str(e)})
            return

        if path == '/api/version/install':
            data = parse_body(self)
            new_version = data.get('version', '')
            version_data = load_json(VERSION_FILE, {'current_version':'0.0.0','updates':[]})
            for update in version_data.get('updates', []):
                if update.get('version') == new_version:
                    update['status'] = 'installed'
            version_data['current_version'] = new_version
            save_json(VERSION_FILE, version_data)
            self.send_json({'ok': True})
            return

        if path == '/api/admin/generate-code':
            user = get_session_user(self.headers)
            if not user or not user.get('is_admin'):
                self.send_json({'error':'Unauthorized'}, 401)
                return
            data = parse_body(self)
            count = min(int(data.get('count', 1)), 50)
            plan_type = data.get('type', 'monthly')
            prefix = 'MES' if plan_type == 'monthly' else 'ANO'
            licenses = load_json(LICENSES_FILE, {'codes': []})
            new_codes = []
            for _ in range(count):
                code = 'NELC-' + prefix + '-' + secrets.token_hex(3).upper() + '-' + secrets.token_hex(3).upper()
                licenses['codes'].append({
                    'code': code,
                    'type': plan_type,
                    'used': False,
                    'used_by': '',
                    'created': time.strftime('%Y-%m-%d %H:%M:%S')
                })
                new_codes.append(code)
            save_json(LICENSES_FILE, licenses)
            self.send_json({'ok': True, 'codes': new_codes, 'type': plan_type})
            return

        if path == '/api/admin/delete-code':
            user = get_session_user(self.headers)
            if not user or not user.get('is_admin'):
                self.send_json({'error':'Unauthorized'}, 401)
                return
            data = parse_body(self)
            code = data.get('code', '')
            licenses = load_json(LICENSES_FILE, {'codes': []})
            licenses['codes'] = [c for c in licenses['codes'] if c.get('code') != code]
            save_json(LICENSES_FILE, licenses)
            self.send_json({'ok': True})
            return

        if path == '/api/redeem-code':
            user = get_session_user(self.headers)
            if not user:
                self.send_json({'error':'Unauthorized'}, 401)
                return
            data = parse_body(self)
            code = data.get('code', '').strip().upper()
            licenses = load_json(LICENSES_FILE, {'codes': []})
            for lic in licenses.get('codes', []):
                if lic.get('code') == code and not lic.get('used'):
                    lic['used'] = True
                    lic['used_by'] = user.get('email', '')
                    lic['used_at'] = time.strftime('%Y-%m-%d %H:%M:%S')
                    save_json(LICENSES_FILE, licenses)
                    plan_type = lic.get('type', 'annual')
                    days = 30 if plan_type == 'monthly' else 365
                    users = load_json(USERS_FILE, {'users': []})
                    for u in users.get('users', []):
                        if u.get('email') == user.get('email'):
                            u['premium'] = True
                            u['license'] = code
                            now = time.time()
                            old_expire = u.get('expire_at', '')
                            base = now
                            if old_expire:
                                try:
                                    old_ts = time.mktime(time.strptime(old_expire, '%Y-%m-%d'))
                                    if old_ts > now:
                                        base = old_ts
                                except: pass
                            u['expire_at'] = (base + days*24*3600).strftime('%Y-%m-%d')
                            break
                    save_json(USERS_FILE, users)
                    sessions = load_json(SESSIONS_FILE, {})
                    for tok, s in sessions.items():
                        if s.get('email') == user.get('email'):
                            s['premium'] = True
                            break
                    save_json(SESSIONS_FILE, sessions)
                    self.send_json({'ok': True, 'message': 'Codigo resgatado com sucesso!'})
                    return
            self.send_json({'ok': False, 'error': 'Codigo invalido ou ja utilizado'}, 400)
            return

        if path.startswith('/api/data/'):
            user = get_session_user(self.headers)
            if not user:
                self.send_json({'error': 'Unauthorized'}, 401)
                return
            parts = path.split('/')
            collection = parts[3] if len(parts) > 3 else ''
            if not collection:
                self.send_json({'error': 'Missing collection'}, 400)
                return
            data = parse_body(self)
            uf = os.path.join(DATA_DIR, user['email'].replace('@','_at_') + '.json')
            all_data = load_json(uf, {'transactions':[],'investments':[],'suppliers':[],'purchases':[],'sales':[]})
            if collection not in all_data:
                all_data[collection] = []
            if data.get('_delete') and data.get('demo_id'):
                all_data[collection] = [i for i in all_data[collection] if i.get('demo_id') != data['demo_id'] and i.get('id') != data['demo_id']]
                save_json(uf, all_data)
                self.send_json({'ok': True})
                return
            demo_id = data.pop('demo_id', None)
            if demo_id:
                data['id'] = demo_id
                existing = [i for i in all_data[collection] if i.get('id') == demo_id]
                if existing:
                    for k, v in data.items():
                        if k != 'id':
                            existing[0][k] = v
                    existing[0]['updated'] = time.strftime('%Y-%m-%d %H:%M:%S')
                    save_json(uf, all_data)
                    self.send_json({'ok': True, 'item': existing[0]})
                    return
            else:
                data['id'] = secrets.token_hex(8)
            data['created'] = time.strftime('%Y-%m-%d %H:%M:%S')
            all_data[collection].append(data)
            save_json(uf, all_data)
            self.send_json({'ok': True, 'item': data})
            return

        self.send_response(404)
        self.end_headers()
        self.wfile.write(b'Not found')
        self.wfile.write(b'Not found')

    def do_DELETE(self):
        path = self.path.split('?')[0]
        user = get_session_user(self.headers)

        if path.startswith('/api/data/'):
            if not user:
                self.send_json({'error': 'Unauthorized'}, 401)
                return
            parts = path.split('/')
            collection = parts[3] if len(parts) > 3 else ''
            item_id = parts[4] if len(parts) > 4 else ''
            if not collection or not item_id:
                self.send_json({'error': 'Missing id'}, 400)
                return
            uf = os.path.join(DATA_DIR, user['email'].replace('@','_at_') + '.json')
            data = load_json(uf, {'transactions':[],'investments':[],'suppliers':[],'purchases':[],'sales':[]})
            if collection in data:
                data[collection] = [i for i in data[collection] if i.get('id') != item_id]
                save_json(uf, data)
            self.send_json({'ok': True})
            return

        self.send_response(404)
        self.end_headers()

    def do_PUT(self):
        path = self.path.split('?')[0]
        user = get_session_user(self.headers)

        if path.startswith('/api/data/'):
            if not user:
                self.send_json({'error': 'Unauthorized'}, 401)
                return
            parts = path.split('/')
            collection = parts[3] if len(parts) > 3 else ''
            item_id = parts[4] if len(parts) > 4 else ''
            if not collection or not item_id:
                self.send_json({'error': 'Missing collection or id'}, 400)
                return
            update = parse_body(self)
            uf = os.path.join(DATA_DIR, user['email'].replace('@','_at_') + '.json')
            all_data = load_json(uf, {'transactions':[],'investments':[],'suppliers':[],'purchases':[],'sales':[]})
            if collection in all_data:
                for item in all_data[collection]:
                    if item.get('id') == item_id:
                        for k, v in update.items():
                            if k != 'id' and k != 'created':
                                item[k] = v
                        item['updated'] = time.strftime('%Y-%m-%d %H:%M:%S')
                        save_json(uf, all_data)
                        self.send_json({'ok': True, 'item': item})
                        return
            self.send_json({'error': 'Item not found'}, 404)
            return

        self.send_response(404)
        self.end_headers()
        self.wfile.write(b'Not found')

print('NELCi Tech 3D Server - Port 8080')
http.server.HTTPServer(('0.0.0.0', 8080), Handler).serve_forever()
