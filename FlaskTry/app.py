from flask import Flask, redirect, url_for, render_template, request, Response #request用來處理讀取HTML來的post value (ex: 文字輸入框)
import cv2
# audio streaming
# import pyaudio

app=Flask(__name__)
camera=cv2.VideoCapture(0)


# ================================== Needed Functions ==============================================
## [Camera Streaming]
def generate_frames():
    while True:  
        ## read the camera frame
        success,frame=camera.read()
        if not success:
            break
        else:
            ret,buffer=cv2.imencode('.jpg',frame)
            frame=buffer.tobytes() 
			
        yield(b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n') 



# ================================ Flask Application ==============================================
@app.route('/')
def index():
    return render_template('index.html')

## [Camera Streaming]
@app.route('/video')
def video():
    return Response(generate_frames(),mimetype='multipart/x-mixed-replace; boundary=frame')

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
    return "ok"


# =========================================== Main ===============================================
if __name__=="__main__":
    app.run(debug=True)
