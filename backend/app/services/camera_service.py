import cv2

def mjpeg_stream(analyzer, camera_index: int = 0):
    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        raise RuntimeError(f"Camera {camera_index} could not be opened.")

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    frame_id = 0
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break

            frame_id += 1
            if frame_id % 5 == 0:
                result = analyzer.analyze(frame)
                for p in result["persons"]:
                    h, w = frame.shape[:2]
                    x = int(p["x"] * w)
                    y = int(p["y"] * h)
                    bw = int(p["width"] * w)
                    bh = int(p["height"] * h)
                    cv2.rectangle(frame, (x, y), (x + bw, y + bh), (255, 255, 255), 2)
                for f in result["faces"]:
                    h, w = frame.shape[:2]
                    x = int(f["x"] * w)
                    y = int(f["y"] * h)
                    fw = int(f["width"] * w)
                    fh = int(f["height"] * h)
                    cv2.rectangle(frame, (x, y), (x + fw, y + fh), (180, 180, 180), 2)

            ok, jpg = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            if not ok:
                continue
            yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + jpg.tobytes() + b"\r\n"
    finally:
        cap.release()
