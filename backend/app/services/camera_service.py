import cv2
import logging
logger=logging.getLogger("fitai.camera")

def mjpeg_stream(analyzer,camera_index:int=0):
    logger.info("Opening OpenCV camera index=%s",camera_index)
    cap=cv2.VideoCapture(camera_index,cv2.CAP_DSHOW)
    if not cap.isOpened():
        cap.release(); cap=cv2.VideoCapture(camera_index)
    if not cap.isOpened(): raise RuntimeError(f"Camera {camera_index} could not be opened.")
    cap.set(cv2.CAP_PROP_FRAME_WIDTH,1280); cap.set(cv2.CAP_PROP_FRAME_HEIGHT,720)
    frame_id=0
    try:
        while True:
            ok,frame=cap.read()
            if not ok: logger.error("Camera frame read failed"); break
            frame_id+=1
            if frame_id%5==0:
                result=analyzer.analyze(frame)
                h,w=frame.shape[:2]
                points=result.get("landmarks",[])
                if points:
                    xs=[p["x"] for p in points]; ys=[p["y"] for p in points]
                    x1,y1=int(max(0,min(xs))*w),int(max(0,min(ys))*h)
                    x2,y2=int(min(1,max(xs))*w),int(min(1,max(ys))*h)
                    cv2.rectangle(frame,(x1,y1),(x2,y2),(255,255,255),2)
                for f in result.get("faces",[]):
                    x,y=int(f["x"]*w),int(f["y"]*h); fw,fh=int(f["width"]*w),int(f["height"]*h)
                    cv2.rectangle(frame,(x,y),(x+fw,y+fh),(180,180,180),2)
            ok,jpg=cv2.imencode(".jpg",frame,[int(cv2.IMWRITE_JPEG_QUALITY),80])
            if ok: yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n"+jpg.tobytes()+b"\r\n"
    finally:
        logger.info("Releasing OpenCV camera index=%s",camera_index); cap.release()
