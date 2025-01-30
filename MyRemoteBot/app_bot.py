from flask import Flask, redirect, url_for, render_template, request, Response, jsonify #request用來處理讀取HTML來的post value (ex: 文字輸入框)
# [For Flask Login]
from flask import flash, session
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
import os
from configparser import ConfigParser

app=Flask(__name__)


# =========================================== For Flask login: Initializing ===============================================
# Make secret key dynamically
# Generate the secret key
secret_key = os.urandom(16).hex()
# Get Secret Key From Config
# 設定 flask 的密鑰secret_key。要先替 flask 設定好secret_key，Flask-Login 才能運作。secret_key最好是一串亂碼，而且不要太招搖的讓大家都知道。我們可以用
# Step 1: Create an instance of ConfigParser
config = ConfigParser()
# Step 2: Read the 'config.ini' file to load the settings
config.read('config.ini')
# Make sure the [flask] section exists
if not config.has_section('flask'):
    config.add_section('flask')
# Set the secret key in the config file
config.set('flask', 'secret_key', secret_key)
# Save the configuration
with open('config.ini', 'w') as configfile:
    config.write(configfile)
# # Step 3: Retrieve the secret key from the 'flask' section
# app.secret_key = config.get('flask', 'secret_key')
app.secret_key = secret_key
# Step 4: Set the secret key to app.config['SECRET_KEY'] (optional but common practice)
app.config['SECRET_KEY'] = app.secret_key


login_manager = LoginManager() # 產生一個LoginManager()物件來初始化 Flask-Login
login_manager.init_app(app) #將 flask 和 Flask-Login 綁定起來
login_manager.session_protection = "strong" #將session_proctection調整到最強。預設是"basic"，也會有一定程度的保護，所以這行可選擇不寫上去。
# login_manager.session_protection = "basic"
login_manager.login_view = 'login' #當UserAccount還沒登入，卻請求了一個需要登入權限才能觀看的網頁時，我們就先送使用找到login_view所指定的位置來。以這行程式碼為例，當未登入的UserAccount請求了一個需要權限的網頁時，就將他送到代表login()的位址去。我們現在還沒寫出login()這個函數，所以等等要補上。
login_manager.login_message = '請證明你並非來自黑暗草泥馬界' #login_message是和login_view相關的設定，當未登入的UserAccount被送到login_view所指定的位址時，會一併跳出的訊息。


# =========================================== For Flask login: Functions ===============================================
class User(UserMixin): #宣告我們要借用 Flask-Login 提供的類別UserMixin，並放在User這個物件上。其實我們沒有對UserMixin做出任何更動，因此下面那行程式碼用個pass就行。
    pass

@login_manager.user_loader
def user_loader(UserAccount): #做一個驗證UserAccount是否登入的user_loader()。下面的程式碼基本上就是確認UserAccount是否是在我們的合法清單users當中，若沒有，就什麼都不做。若有，就宣告一個我們剛才用UserMixin做出來的物件User()，貼上user標籤，並回傳給呼叫這個函數user_loader()的地方。
    if UserAccount not in users:
        return

    user = User()
    user.id = UserAccount
    return user

@login_manager.request_loader #做一個從flask.request驗證UserAccount是否登入的request_loader()。下面的程式碼基本上就是確認UserAccount是否是在我們的合法清單users當中，若沒有，就什麼都不做。若有，就宣告一個我們剛才用UserMixin做出來的物件User()，貼上user標籤，並回傳給呼叫這個函數request_loader()的地方。並在最後利用user.is_authenticated = request.form['password'] == users[UserAccount]['password']來設定UserAccount是否成功登入獲得權限了。若UserAccount在登入表單中輸入的密碼 request.form['password']和我們知道的users[UserAccount]['password']一樣，就回傳True到user.is_authenticated上。
def request_loader(request):
    UserAccount = request.form.get('user_id')
    if UserAccount not in users:
        return

    user = User()
    user.id = UserAccount

    # DO NOT ever store passwords in plaintext and always compare password
    # hashes using constant-time comparison!
    user.is_authenticated = request.form['password'] == users[UserAccount]['password']

    return user

users = {'Me': {'password': 'myself'}, 
         '幻影之翠': {'password': '123456'}} #定義一個UserAccount清單，'Me'是帳號(或說是UserAccount名稱)，這個帳號的密碼是'myself'。這當然是一個簡單的設定方式。喜歡的話也可以在 Heroku Postgres 上另外做一個表單(table)，並將UserAccount資料存放在那邊。



# =========================================== For Flask Login / ===============================================
@app.route('/')
def goToLogin(): 
    return redirect(url_for('login'))
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template("login.html")
    
    UserAccount = request.form['user_id']
    if (UserAccount in users) and (request.form['password'] == users[UserAccount]['password']):
        user = User()
        user.id = UserAccount
        login_user(user)

        # 🔥 Make session expire when browser closes
        # session.permanent = False
        print(f"User Authenticated: {current_user.is_authenticated}")  # Debugging
        flash(f'{UserAccount}！歡迎回來！')
        return redirect(url_for('index'))

    flash('登入失敗了...')
    return render_template('login.html')

@app.route('/logout')
def logout():
    UserAccount = current_user.get_id()
    logout_user()
    flash(f'{UserAccount}！歡迎下次再來！')
    return render_template('login.html')

'''
剩下最簡單的一步了，也就是告訴 Flask-Login 哪些網址需要UserAccount處於登入狀態才可瀏覽。
只要在我們已經做好的路由下面，加上 "@login_requierd" 就搞定，以我們的"/show_records"為例子：
@app.route("/show_records")
@login_required
def show_records():
    python_records =web_select_overall()
    return render_template("show_records.html", html_records=python_records)
'''

# =========================================== Render Template for Pages ===============================================
@app.route('/index')
@login_required
def index():
    return render_template('index.html')

@app.route('/closeClient')
@login_required
def closeClient():
    return render_template('closeClient.html')

@app.route('/remoteClient')
@login_required
def remoteClient():
    return render_template('remoteClient.html')


# =========================================== My Functions ===============================================
# ---------------------------- [For Index Page (Directory)] ----------------------------
@app.route('/directory', methods=['POST'])
def goToDirectory():
    now_command=""
    redirectingPage = "" 
    now_command = request.form.get("command")
    print(f"Received command: {now_command}")  # Debugging output (check in the terminal)
    
    if (now_command=='goToRemoteClient'): 
        print("redirecting to remoteClient.html")
        redirectingPage = "remoteClient"
    elif (now_command=='goToCloseClient'): 
        print("redirecting to closeClient.html")
        redirectingPage = "closeClient"    
    # return redirect(url_for(redirectingPage))
    # <Debug1> 一般return redirect(url_for(myresult))就會自動redirect了, 但是你現在是用 JavaScript's fetch(), which sends an AJAX request, fetch() receives the redirect response as data, but does not automatically navigate.
    # <Debug1> 所以用AJAX request時要改用下面
    return jsonify({"redirect": url_for(redirectingPage)})  

# ---------------------------- [For Remote Client Page] ----------------------------
# 1. control pannel
## [Control Panel]
@app.route('/control_panel', methods=['GET', 'POST'])
def control_panel(): 
    now_command=""
    print('in')
    if request.method=='POST': 
        # now_command=request.form(['command'])
        now_command = request.form.get("command")
        print(f"Received command: {now_command}")  # Debugging output (check in the terminal)

    # return render_template("control_panel.html", command=now_command)
    return "now_command: "+str(now_command)

# 2. video stream for remote client


# =========================================== Main ===============================================
if __name__=="__main__":
    app.run(debug=True)
