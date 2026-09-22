import time
import cv2
import numpy as np
import mediapipe as mp

POSE_NAMES = [
"nose","left_eye_inner","left_eye","left_eye_outer","right_eye_inner","right_eye","right_eye_outer",
"left_ear","right_ear","mouth_left","mouth_right","left_shoulder","right_shoulder","left_elbow",
"right_elbow","left_wrist","right_wrist","left_pinky","right_pinky","left_index","right_index",
"left_thumb","right_thumb","left_hip","right_hip","left_knee","right_knee","left_ankle","right_ankle",
"left_heel","right_heel","left_foot_index","right_foot_index"]

class PersonAnalyzer:
    def __init__(self):
        self.pose = mp.solutions.pose.Pose(
            static_image_mode=False, model_complexity=1, smooth_landmarks=True,
            enable_segmentation=True, smooth_segmentation=True,
            min_detection_confidence=0.5, min_tracking_confidence=0.5)
        self.face = mp.solutions.face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5)
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(static_image_mode=False, max_num_faces=2, refine_landmarks=True, min_detection_confidence=0.5, min_tracking_confidence=0.5)

    @staticmethod
    def _decode(data):
        image=cv2.imdecode(np.frombuffer(data,np.uint8),cv2.IMREAD_COLOR)
        if image is None: raise ValueError("Invalid or unsupported image.")
        return image

    def analyze_bytes(self,data):
        return self.analyze(self._decode(data))

    def analyze(self,image):
        started=time.perf_counter()
        h,w=image.shape[:2]
        rgb=cv2.cvtColor(image,cv2.COLOR_BGR2RGB)
        pose_result=self.pose.process(rgb)
        face_result=self.face.process(rgb)
        mesh_result=self.face_mesh.process(rgb)
        landmarks=[]
        if pose_result.pose_landmarks:
            for i,lm in enumerate(pose_result.pose_landmarks.landmark):
                landmarks.append({"name":POSE_NAMES[i],"x":round(float(lm.x),5),"y":round(float(lm.y),5),
                    "z":round(float(lm.z),5),"visibility":round(float(lm.visibility),4)})
        faces=[]
        if face_result.detections:
            for det in face_result.detections:
                bb=det.location_data.relative_bounding_box
                faces.append({"x":round(max(0.0,float(bb.xmin)),4),"y":round(max(0.0,float(bb.ymin)),4),
                    "width":round(min(1.0,float(bb.width)),4),"height":round(min(1.0,float(bb.height)),4),
                    "confidence":round(float(det.score[0]),4)})
        face_mesh=[]
        if mesh_result.multi_face_landmarks:
            mesh_indices=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109]
            for face_lms in mesh_result.multi_face_landmarks:
                face_mesh.append([{"index":i,"x":round(float(face_lms.landmark[i].x),5),"y":round(float(face_lms.landmark[i].y),5),"z":round(float(face_lms.landmark[i].z),5)} for i in mesh_indices])
        segmentation=None
        if pose_result.segmentation_mask is not None:
            mask=pose_result.segmentation_mask
            segmentation={"foreground_ratio":round(float(np.mean(mask>0.5)),4),
                          "mean_confidence":round(float(np.mean(mask)),4)}
        by={x["name"]:x for x in landmarks}
        def d(a,b):
            if a not in by or b not in by:return None
            return round(((by[a]["x"]-by[b]["x"])**2+(by[a]["y"]-by[b]["y"])**2)**0.5,4)
        body={"shoulder_span_norm":d("left_shoulder","right_shoulder"),
              "hip_span_norm":d("left_hip","right_hip"),
              "left_upper_arm_norm":d("left_shoulder","left_elbow"),
              "right_upper_arm_norm":d("right_shoulder","right_elbow")}
        return {"detected":bool(landmarks or faces),"image":{"width":w,"height":h},"landmarks":landmarks,
            "faces":faces,"face_count":len(faces),"face_mesh":face_mesh,"segmentation":segmentation,"body":body,
            "confidence":round(float(np.mean([x["visibility"] for x in landmarks])) if landmarks else 0.0,4),
            "latency_ms":round((time.perf_counter()-started)*1000,1),
            "capabilities":{"person_detection":True,"face_detection":True,"face_mesh":True,"hair_semantic_segmentation":False,"pose":True,"segmentation":True,
                "normalized_body_geometry":True,"metric_anthropometry":False,"face_identity":False,
                "age_estimation":False,"presentation_estimation":False,"expression_inference":False},
            "notes":["33-point pose and person segmentation are real MediaPipe inference.",
                     "Body dimensions are normalized image geometry, not centimeters.",
                     "Identity, demographics and emotion are intentionally unavailable until reviewed providers are installed."]}
