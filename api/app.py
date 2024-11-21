   from flask import Flask, request, session, redirect, url_for, render_template
   import requests
   import hashlib
   import os

   app = Flask(__name__)
   app.secret_key = os.urandom(24)  # Ganti dengan kunci rahasia Anda
   BOT_TOKEN = os.environ.get('BOT_TOKEN')  # Ambil dari variabel lingkungan
   ADMIN_CHAT_ID = os.environ.get('ADMIN_CHAT_ID')  # Ambil dari variabel lingkungan
   TELEGRAM_CHANNEL_ID = 777000  # ID saluran resmi Telegram

   # Halaman login
   @app.route('/')
   def login():
       return render_template('login.html', bot_username=os.environ.get('BOT_USERNAME'))

   # Endpoint untuk menangani otentikasi
   @app.route('/auth')
   def auth():
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

   # Endpoint untuk logout
   @app.route('/logout')
   def logout():
       session.pop('user', None)
       return redirect(url_for('login'))

   if __name__ == '__main__':
       app.run()
